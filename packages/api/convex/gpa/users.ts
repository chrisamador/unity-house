import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

// Get the current user's profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the user from the identity
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosId', identity.subject))
      .first();
    
    if (!user) {
      return null;
    }

    return user;
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get the user from the identity
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosId', identity.subject))
      .first();
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Check if the user is an admin
    if (currentUser.memberType !== 'admin') {
      throw new Error('Admin access required');
    }

    // Get all users
    const users = await ctx.db
      .query('users')
      .collect();

    return users;
  },
});

// Approve a user (admin only)
export const approveUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get the user from the identity
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosId', identity.subject))
      .first();
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Check if the user is an admin
    if (currentUser.memberType !== 'admin') {
      throw new Error('Admin access required');
    }

    // Update the user's approval status
    await ctx.db.patch(args.userId, { 
      approvedBy: currentUser._id 
    });

    return true;
  },
});

// Get school statistics (admin only)
export const getSchoolStatistics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get the user from the identity
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosId', identity.subject))
      .first();
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Check if the user is an admin
    if (currentUser.memberType !== 'admin') {
      throw new Error('Admin access required');
    }

    // Get statistics for each school
    const users = await ctx.db
      .query('users')
      .collect();

    // Group users by school
    const schoolStats: Record<string, { 
      totalUsers: number; 
      totalCourses: number;
      averageGPA: number;
    }> = {};

    for (const user of users) {
      const school = user.school || 'Unknown';
      
      if (!schoolStats[school]) {
        schoolStats[school] = {
          totalUsers: 0,
          totalCourses: 0,
          averageGPA: 0
        };
      }
      
      schoolStats[school].totalUsers++;
      
      // Get courses for this user
      const courses = await ctx.db
        .query('courses')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      
      schoolStats[school].totalCourses += courses.length;
      
      // Calculate GPA
      let totalGradePoints = 0;
      let totalCredits = 0;
      
      for (const course of courses) {
        if (course.currentGPA !== undefined) {
          totalGradePoints += course.currentGPA * course.creditHours;
          totalCredits += course.creditHours;
        }
      }
      
      if (totalCredits > 0) {
        const userGPA = totalGradePoints / totalCredits;
        schoolStats[school].averageGPA += userGPA;
      }
    }
    
    // Calculate average GPA for each school
    for (const school in schoolStats) {
      if (schoolStats[school].totalUsers > 0) {
        schoolStats[school].averageGPA = Math.round((schoolStats[school].averageGPA / schoolStats[school].totalUsers) * 100) / 100;
      }
    }

    return schoolStats;
  },
});
