// packages/api/convex/auth.ts
import { Auth } from "convex/server";
import { ConvexError } from "convex/values";

/**
 * Validates that the request is authenticated.
 * Throws an error if the user is not authenticated.
 * 
 * @param context - The Convex context containing auth information
 * @returns The authenticated user ID
 */
export async function validateAuth(ctx?: { auth: Auth }) {
  const identity = await ctx?.auth?.getUserIdentity()
  if (!identity) {
    throw new ConvexError("Unauthorized: Authentication required");
  }
  
  const userId = identity.subject;
  if (!userId) {
    throw new ConvexError("Unauthorized: User ID not found");
  }
  
  return identity;
}

// export function getUserId(ctx: { auth: Auth }) {
//   return (await ctx.auth.getUserIdentity())?.subject;
// };