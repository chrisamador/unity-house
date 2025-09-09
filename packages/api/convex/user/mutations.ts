import { internalMutation, MutationCtx } from 'convex/_generated/server';
import { v } from 'convex/values';

const upsertUserArgs = {
  email: v.string(), // chris+testing@plnr.app
  emailVerified: v.boolean(), // true
  externalId: v.optional(v.string()), // null
  firstName: v.optional(v.string()), // Chris
  id: v.string(), // user_01K4ATWQMPZ0EPCJ1WSDP56JWN
  lastName: v.optional(v.string()), // Amador
  profilePictureUrl: v.optional(v.string()), // null
  updatedAt: v.string(), // 2025-09-06T02:59:32.612Z
};

export const upsertUser = internalMutation({
  args: upsertUserArgs,
  handler: async (ctx, args) => {
    const user = await upsertUserInternal(ctx, args);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },
});

async function upsertUserInternal(
  ctx: MutationCtx,
  args: {
    firstName?: string | undefined;
    lastName?: string | undefined;
    profilePictureUrl?: string | undefined;
    externalId?: string | undefined;
    id: string;
    email: string;
    emailVerified: boolean;
    updatedAt: string;
  }
) {
  const user = await ctx.db
    .query('users')
    .withIndex('by_workos_id', q => q.eq('workosId', args.id))
    .first();
  if (!user) {
    console.log('Creating new user');
    const newUser = await ctx.db.insert('users', {
      workosId: args.id,
      firstName: args.firstName || '',
      lastName: args.lastName || '',
      email: args.email,
      emailVerified: args.emailVerified,
      updatedAt: args.updatedAt,
      profilePictureUrl: args.profilePictureUrl,
      entityIds: [],
      organizationIds: [],
      memberType: 'public',
    });
    return await ctx.db.get(newUser);
  }
  if (args.updatedAt > user.updatedAt) {
    console.log('Updating user');
    await ctx.db.patch(user._id, {
      workosId: args.id,
      firstName: args.firstName || '',
      lastName: args.lastName || '',
      email: args.email,
      emailVerified: args.emailVerified,
      updatedAt: args.updatedAt,
      profilePictureUrl: args.profilePictureUrl,
    });
    return await ctx.db.get(user._id);
  }
  return user;
}
