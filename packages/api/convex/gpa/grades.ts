import { getAuthUser } from 'convex/auth/utils';
import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

// Add or update a grade for an assignment
export const addGrade = mutation({
  args: {
    assignmentId: v.id('assignments'),
    pointsEarned: v.number(),
    maxPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get the user ID from the identity
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', q => q.eq('workosId', identity.subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.userId !== user._id) {
      throw new Error('Assignment not found or access denied');
    }

    const percentage = (args.pointsEarned / args.maxPoints) * 100;

    // Check if grade already exists
    const existingGrade = await ctx.db
      .query('grades')
      .withIndex('by_assignment', q => q.eq('assignmentId', args.assignmentId))
      .filter(q => q.eq(q.field('userId'), user._id))
      .unique();

    if (existingGrade) {
      // Update existing grade
      await ctx.db.patch(existingGrade._id, {
        pointsEarned: args.pointsEarned,
        maxPoints: args.maxPoints,
        percentage,
        enteredAt: Date.now(),
      });
      return existingGrade._id;
    } else {
      // Create new grade
      return await ctx.db.insert('grades', {
        assignmentId: args.assignmentId,
        userId: user._id,
        pointsEarned: args.pointsEarned,
        maxPoints: args.maxPoints,
        percentage,
        enteredAt: Date.now(),
      });
    }
  },
});

// Get all grades for the current user
export const getUserGrades = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get the user ID from the identity
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', q => q.eq('workosId', identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .collect();

    return await Promise.all(
      grades.map(async grade => {
        const assignment = await ctx.db.get(grade.assignmentId);
        const course = assignment ? await ctx.db.get(assignment.courseId) : null;
        return {
          ...grade,
          assignment,
          course,
        };
      })
    );
  },
});

// // Calculate the user's GPA
// export const calculateUserGPA = mutation({
//   args: {},
//   handler: async ctx => {
//     const user = await getAuthUser(ctx);

//     if (!user) {
//       throw new Error('User not found');
//     }

//     const courses = await ctx.db
//       .query('courses')
//       .withIndex('by_user', q => q.eq('userId', user._id))
//       .collect();

//     let totalGradePoints = 0;
//     let totalCredits = 0;

//     for (const course of courses) {
//       // Get all assignments for this course
//       const syllabi = await ctx.db
//         .query('syllabi')
//         .withIndex('by_course', q =>
//           q
//             .eq('courseCode', course.courseCode)
//             .eq('semester', course.semester)
//             .eq('year', course.year)
//         )
//         .filter(q => q.eq(q.field('userId'), user._id))
//         .collect();

//       if (syllabi.length === 0) continue;

//       const syllabus = syllabi[0];
//       const assignments = await ctx.db
//         .query('assignments')
//         .withIndex('by_syllabus', q => q.eq('syllabusId', syllabus._id))
//         .collect();

//       let courseWeightedScore = 0;
//       let totalWeight = 0;

//       for (const assignment of assignments) {
//         const grade = await ctx.db
//           .query('grades')
//           .withIndex('by_assignment', q => q.eq('assignmentId', assignment._id))
//           .filter(q => q.eq(q.field('userId'), user._id))
//           .unique();

//         if (grade) {
//           courseWeightedScore += grade.percentage * (assignment.weight / 100);
//           totalWeight += assignment.weight;
//         }
//       }

//       if (totalWeight > 0) {
//         const courseGrade = courseWeightedScore / (totalWeight / 100);
//         const gradePoints = percentageToGradePoints(courseGrade);
//         totalGradePoints += gradePoints * course.creditHours;
//         totalCredits += course.creditHours;

//         // Update course GPA
//         await ctx.db.patch(course._id, { currentGPA: gradePoints });
//       }
//     }

//     const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
//     return { gpa: Math.round(gpa * 100) / 100, totalCredits };
//   },
// });

// Get the school average GPA
export const getSchoolAverageGPA = query({
  args: {
    semester: v.optional(v.string()),
    year: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get all users with the same school
    const usersWithSameSchool = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('school'), user.school || ''))
      .collect();

    let totalGPA = 0;
    let studentsWithGPA = 0;

    for (const student of usersWithSameSchool) {
      // Get courses for this student
      const courses = await ctx.db
        .query('courses')
        .withIndex('by_user', q => q.eq('userId', student._id))
        .collect();
        
      // Filter courses by semester and year if provided
      const filteredCourses = courses.filter(course => {
        const semesterMatch = !args.semester || args.semester === 'All' || course.semester === args.semester;
        const yearMatch = !args.year || args.year === 0 || course.year === args.year;
        return semesterMatch && yearMatch;
      });

      let studentTotalGradePoints = 0;
      let studentTotalCredits = 0;

      for (const course of filteredCourses) {
        if (course.currentGPA !== undefined) {
          studentTotalGradePoints += course.currentGPA * course.creditHours;
          studentTotalCredits += course.creditHours;
        }
      }

      if (studentTotalCredits > 0) {
        const studentGPA = studentTotalGradePoints / studentTotalCredits;
        totalGPA += studentGPA;
        studentsWithGPA++;
      }
    }

    const averageGPA = studentsWithGPA > 0 ? totalGPA / studentsWithGPA : 0;
    return {
      averageGPA: Math.round(averageGPA * 100) / 100,
      totalStudents: studentsWithGPA,
    };
  },
});

// Get available semesters and years from courses
export const getAvailableSemesters = query({
  args: {},
  handler: async ctx => {
    const user = await getAuthUser(ctx);
    
    if (!user) {
      return [];
    }
    
    // Get all courses for the user
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .collect();
    
    return courses.map(course => ({
      semester: course.semester,
      year: course.year
    }));
  },
});

// Calculate GPA for a specific semester and year
export const calculateSemesterGPA = mutation({
  args: {
    semester: v.optional(v.string()),
    year: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get courses filtered by semester and year if provided
    let coursesQuery = ctx.db
      .query('courses')
      .withIndex('by_user', q => q.eq('userId', user._id));
      
    // Apply filters if provided
    const courses = await coursesQuery.collect();
    
    // Filter courses by semester and year if provided
    const filteredCourses = courses.filter(course => {
      const semesterMatch = !args.semester || args.semester === 'All' || course.semester === args.semester;
      const yearMatch = !args.year || args.year === 0 || course.year === args.year;
      return semesterMatch && yearMatch;
    });
    
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    for (const course of filteredCourses) {
      // Use the existing GPA calculation logic
      if (course.currentGPA !== undefined) {
        totalGradePoints += course.currentGPA * course.creditHours;
        totalCredits += course.creditHours;
      }
    }
    
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    return { 
      gpa: Math.round(gpa * 100) / 100, 
      totalCredits,
      semester: args.semester || 'All',
      year: args.year || 0
    };
  },
});

// Helper function to convert percentage to grade points
function percentageToGradePoints(percentage: number): number {
  if (percentage >= 97) return 4.0;
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 63) return 1.0;
  if (percentage >= 60) return 0.7;
  return 0.0;
}
