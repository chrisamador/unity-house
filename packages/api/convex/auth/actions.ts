import { internal } from 'convex/_generated/api';
import { v } from 'convex/values';
import { Doc } from '../_generated/dataModel';
import { action } from '../_generated/server';

internal.user.mutations.upsertUser._returnType;
export const exchangeCode = action({
  args: {
    code: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ accessToken: string; sealedSession?: string; user: Doc<'users'> }> => {
    const { code } = args;
    const res = await ctx.runAction(internal.auth.workos.authenticateWithCode, { code });
    const user = await ctx.runMutation(internal.user.mutations.upsertUser, {
      id: res.user.id,
      firstName: res.user.firstName || undefined,
      lastName: res.user.lastName || undefined,
      email: res.user.email,
      emailVerified: res.user.emailVerified,
      externalId: res.user.externalId || undefined,
      updatedAt: res.user.updatedAt,
      profilePictureUrl: res.user.profilePictureUrl || undefined,
    });

    return {
      accessToken: res.accessToken,
      sealedSession: res.sealedSession,
      user,
    };
  },
});

export const logout = action({
  args: { sealedSession: v.string(), returnTo: v.string() },
  handler: async (ctx, args) => {
    const logoutUrl = await ctx.runAction(internal.auth.workos.getLogoutUrl, args);
    console.log({ logoutUrl });
    await fetch(logoutUrl, {
      mode: 'no-cors',
      credentials: 'include',
    });
    return 'success';
  },
});


