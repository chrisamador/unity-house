import { internal } from 'convex/_generated/api';
import { httpAction } from 'convex/_generated/server';

export const getAccessToken = httpAction(async (ctx, request) => {
  console.log('getAccessToken');
  const args = (await request.json()) as {
    sealedSession?: string;
    forceRefreshToken?: boolean;
  };

  const sealedSession = args.sealedSession;
  const forceRefreshToken = args.forceRefreshToken;

  if (!sealedSession) {
    console.log('getAccessToken', { args });
    return new Response(JSON.stringify({ error: 'Missing sealedSession' }), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 400,
    });
  }

  console.log('getAccessToken', { args });
  const authRes = await ctx.runAction(internal.auth.workos.authCheck, {
    sealedSession,
    forceRefreshToken,
  });

  // TODO: move the sealSession to a cookie for websites and keep in body for the mobile app

  return new Response(JSON.stringify(authRes), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
});
