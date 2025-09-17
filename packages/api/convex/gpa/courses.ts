import { getAuthUser } from 'convex/auth/utils';
import { v } from 'convex/values';
import { action, mutation, query } from '../_generated/server';

// Generate an upload URL for syllabus files
export const generateUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Create a new course with syllabus
export const createSyllabus = mutation({
  args: {
    courseName: v.string(),
    courseCode: v.string(),
    semester: v.string(),
    year: v.number(),
    fileId: v.id('_storage'),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('createSyllabus', { args });
    const user = await getAuthUser(ctx);

    console.log('createSyllabus', { user });

    // Create a course entry with syllabus data
    const courseId = await ctx.db.insert('courses', {
      userId: user._id,
      courseName: args.courseName,
      courseCode: args.courseCode,
      semester: args.semester,
      year: args.year,
      creditHours: 3, // Default credit hours
      // Syllabus-specific fields
      syllabiFileId: args.fileId,
      syllabiFileName: args.fileName,
      syllabiIsProcessed: false,
      syllabiUploadedAt: Date.now(),
    });

    console.log('createSyllabus: course created', { courseId });
    return courseId;
  },
});

// Get all courses with syllabi for the current user
export const getUserCourses = query({
  args: {},
  handler: async ctx => {
    const user = await getAuthUser(ctx);

    if (!user) {
      return [];
    }

    // Get courses that have syllabus data (fileId exists)
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .order('desc')
      .collect();
      
    // Filter courses that have syllabus data
    const coursesWithSyllabi = courses.filter(course => course.syllabiFileId !== undefined);

    return await Promise.all(
      coursesWithSyllabi.map(async course => ({
        ...course,
        fileUrl: course.syllabiFileId ? await ctx.storage.getUrl(course.syllabiFileId) : null,
      }))
    );
  },
});

// Get a specific course with syllabus by ID
export const getCourseById = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (!user || course.userId !== user._id) {
      throw new Error('Access denied');
    }

    // Check if this course has syllabus data
    if (!course.syllabiFileId) {
      throw new Error('No syllabus attached to this course');
    }

    return {
      ...course,
      fileUrl: await ctx.storage.getUrl(course.syllabiFileId),
    };
  },
});

// Update course information
export const updateSyllabusInfo = mutation({
  args: {
    courseId: v.id('courses'),
    courseName: v.optional(v.string()),
    courseCode: v.optional(v.string()),
    semester: v.optional(v.string()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== user._id) {
      throw new Error('Course not found or access denied');
    }

    const updateData: Record<string, any> = {};
    if (args.courseName !== undefined) updateData.courseName = args.courseName;
    if (args.courseCode !== undefined) updateData.courseCode = args.courseCode;
    if (args.semester !== undefined) updateData.semester = args.semester;
    if (args.year !== undefined) updateData.year = args.year;

    // Only update if we have something to update
    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(args.courseId, updateData);
    }

    return await ctx.db.get(args.courseId);
  },
});

// Mark course syllabus as processed and save assignments
export const processSyllabus = mutation({
  args: {
    courseId: v.id('courses'),
    assignments: v.array(
      v.object({
        name: v.string(),
        dueDate: v.optional(v.string()),
        weight: v.number(),
        category: v.optional(v.string()),
        maxPoints: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    if (!user) {
      throw new Error('User not found');
    }

    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== user._id) {
      throw new Error('Course not found or access denied');
    }

    // Check if this course has syllabus data
    if (!course.syllabiFileId) {
      throw new Error('No syllabus attached to this course');
    }

    // Create assignments
    for (const assignment of args.assignments) {
      await ctx.db.insert('assignments', {
        courseId: args.courseId,
        userId: user._id,
        name: assignment.name,
        dueDate: assignment.dueDate,
        weight: assignment.weight,
        category: assignment.category,
        maxPoints: assignment.maxPoints || 100,
      });
    }

    // Mark course syllabus as processed
    await ctx.db.patch(args.courseId, { syllabiIsProcessed: true });
  },
});

// Get assignments for a specific course
export const getSyllabusAssignments = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query('assignments')
      .withIndex('by_course', q => q.eq('courseId', args.courseId))
      .filter(q => q.eq(q.field('userId'), user._id))
      .collect();
  },
});

export const getFileUrl = action({
  args: { fileId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});
