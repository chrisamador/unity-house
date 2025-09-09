'use node';

import { WorkOS } from '@workos-inc/node';
import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
const clientId = process.env.WORKOS_CLIENT_ID;
if (!clientId) {
  throw new Error('WORKOS_CLIENT_ID not configured');
}
const apiKey = process.env.WORKOS_API_KEY;
if (!apiKey) {
  throw new Error('WORKOS_API_KEY not configured');
}
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
if (!cookiePassword) {
  throw new Error('WORKOS_COOKIE_PASSWORD not configured');
}

export const authenticateWithCode = internalAction({
  args: {
    code: v.string(),
  },
  handler: async (_, { code }) => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY);
    return await workos.userManagement.authenticateWithCode({
      code,
      clientId,
      session: {
        sealSession: true,
        cookiePassword,
      },
    });
  },
});

export const getLogoutUrl = internalAction({
  args: {
    sealedSession: v.string(),
    returnTo: v.string(),
  },
  handler: async (_, { sealedSession, returnTo }) => {
    console.log('internalAction getLogoutUrl');
    const session = loadSealedSession(sealedSession);
    console.log('internalAction session');
    const url = await session.getLogoutUrl({ returnTo });
    console.log('internalAction url', url);
    return url;
  },
});

export const authCheck = internalAction({
  args: {
    sealedSession: v.string(),
    forceRefreshToken: v.optional(v.boolean()),
  },
  handler: async (_, { sealedSession, forceRefreshToken }) => {
    try {
      const session = loadSealedSession(sealedSession);

      if (forceRefreshToken) {
        console.log('Force refreshing token');
        const refresh = await session.refresh();
        if (refresh.authenticated && refresh.session?.accessToken) {
          return {
            authenticated: true,
            user: refresh.user,
            accessToken: refresh.session.accessToken,
            sealedSession: refresh.sealedSession,
          };
        }
      }

      const authenticate = await session.authenticate();

      if (authenticate.authenticated) {
        return {
          authenticated: true,
          user: authenticate.user,
          accessToken: authenticate.accessToken,
          sealedSession,
        };
      }

      const refresh = await session.refresh();
      if (refresh.authenticated && refresh.session?.accessToken) {
        return {
          authenticated: true,
          user: refresh.user,
          accessToken: refresh.session.accessToken,
          sealedSession: refresh.sealedSession,
        };
      }
      return { authenticated: false, user: null, accessToken: null, sealedSession: null };
    } catch (error) {
      return { authenticated: false, user: null, accessToken: null, sealedSession: null };
    }
  },
});

function loadSealedSession(sealedSession: string) {
  if (!cookiePassword || !apiKey) {
    throw new Error('WORKOS_COOKIE_PASSWORD or WORKOS_API_KEY not configured');
  }
  console.log('loadSealedSession');
  const workos = new WorkOS(apiKey, { clientId });
  return workos.userManagement.loadSealedSession({
    sessionData: sealedSession,
    cookiePassword,
  });
}
