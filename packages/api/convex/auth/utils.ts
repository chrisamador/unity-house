// packages/api/convex/auth.ts

import { QueryCtx } from 'convex/_generated/server';
import { ConvexError } from 'convex/values';

/**
 * Validates that the request is authenticated.
 * Throws an error if the user is not authenticated.
 *
 * @param context - The Convex context containing auth information
 * @returns The authenticated user
 */
export async function getAuthUser(ctx?: QueryCtx) {
  const identity = await ctx?.auth?.getUserIdentity();
  if (!identity) {
    throw new ConvexError('Unauthorized: Authentication required');
  }

  const userId = identity.subject;
  if (!userId) {
    throw new ConvexError('Unauthorized: User ID not found');
  }
  const user = await ctx?.db
    .query('users')
    .withIndex('by_workos_id', q => q.eq('workosId', userId))
    .first();

  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

// getAccessToken
