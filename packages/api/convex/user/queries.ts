// packages/api/convex/users.ts
import { v } from "convex/values";
import { query } from "../_generated/server";

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
export const getByWorkosId = query({
  args: { workosId: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .first();
    
    if (!users) {
      throw new Error("User not found");
    }
    
    return users;
  },
});

export const whoAmI = query({
  handler: async (ctx) => {
    const id = await ctx.auth.getUserIdentity()
    console.log("whoAmI", { subject: !!id?.subject })
    return {
      subject: id?.subject,
    }
  },
});