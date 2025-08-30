// packages/api/convex/users.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateAuth } from "./auth";

/**
 * Create a new user in the database
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real implementation, we would validate the input data
    // and check for existing users with the same email or clerkId
    
    // For simplicity in this minimal implementation, we'll just create the user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      firstName: args.name,
      lastName: "",
      school: "Default School", // Required field based on schema
      graduationDate: "2025", // Required field based on schema
      memberType: "public", // Default member type
      organizationIds: [],
      entityIds: [],
    });
    
    return userId;
  },
});

/**
 * Get a user by their ID
 */
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
});

/**
 * Get a user by their Clerk ID
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!users) {
      throw new Error("User not found");
    }
    
    return users;
  },
});

/**
 * Handler for when a user signs in with Clerk
 * Creates a new user if they don't exist yet
 */
export const onSignIn = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await validateAuth(ctx);
    const clerkUserId = identity.subject;
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
      .first();
    
    if (existingUser) {
      // User already exists, nothing to do
      return existingUser._id;
    }
    
    // Create new user
    const user = await ctx.db.insert("users", {
      clerkId: clerkUserId,
      firstName: identity.name || "New User",
      lastName: identity.familyName || "",
      school: "Default School", // Required field based on schema
      graduationDate: "2025", // Required field based on schema
      memberType: "public", // Default member type
      organizationIds: [],
      entityIds: [],
    });
    
    return user;
  },
});
