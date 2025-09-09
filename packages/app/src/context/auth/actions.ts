import { api } from '@unity-house/api/convex/_generated/api';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { clientSafeEnv } from '@/env';
import { deviceStorage } from '@/lib/deviceStorage';
import { base64Decode, base64Encode } from '@/utils/base64';
import { ConvexReactClient } from 'convex/react';
import { AuthType } from './types';

type DepType = {
  state: AuthType['state'];
  convex: ConvexReactClient;
};

export function createAuthActions(deps: DepType) {
  async function handleStartAuthSession({
    provider,
    screenHint,
    callbackPath,
  }: {
    provider: ProviderType;
    screenHint: 'sign-up' | 'sign-in';
    callbackPath: string;
  }) {
    deps.state.setState(() => ({ status: 'loading' }));
    const code = await startAuthSession({ provider, screenHint, callbackPath });
    console.log('handleStartAuthSession', { code });
    if (!code) {
      deps.state.setState(() => ({ status: 'error', message: 'Failed to get code' }));
      return;
    }
    const data = await exchangeCodeForAccessToken(deps, code);
    console.log('handleStartAuthSession', { data: !!data });
    if (!data) {
      deps.state.setState(() => ({ status: 'error', message: 'Failed to get access token' }));
      return;
    }
    // deps.convex.setAuth()
    deps.state.setState(() => ({
      status: 'loaded',
      accessToken: data.accessToken,
      user: data.user,
      sealedSession: data.sealedSession,
    }));
  }

  return {
    // We don't have this async because it runs in a useEffect
    bootstrap() {
      console.log('bootstrap');
      // If the window loads on the callback page, it will try to complete the auth session
      WebBrowser.maybeCompleteAuthSession();

      async function loadAuthState() {
        // Load access token from device storage
        const user = await deviceStorage.get('user');
        const accessToken = await deviceStorage.get('at');
        const sealedSession = await deviceStorage.get('ss');

        console.log('bootstrap', {
          user: !!user,
          accessToken: !!accessToken,
          sealedSession: !!sealedSession,
        });

        if (accessToken && user && sealedSession) {
          console.log('[bootstrap] Loading access token');
          deps.state.setState(() => ({
            status: 'loaded',
            accessToken,
            user: JSON.parse(base64Decode(user)),
            sealedSession,
          }));
        } else {
          deps.state.setState(() => ({ status: 'error', message: 'No access token found' }));
        }
      }

      loadAuthState();

      // Sync state to device storage
      return deps.state.subscribe(async ({ prev, state }) => {
        const hasChanged =
          state.status === 'loaded' &&
          prev.status === 'loaded' &&
          state.accessToken !== prev.accessToken;
        const isNewValue = state.status === 'loaded' && prev.status !== 'loaded';
        if (hasChanged || isNewValue) {
          console.log('Setting access token', { hasChanged, isNewValue });
          // const user Base64
          const userBase64 = base64Encode(JSON.stringify(state.user));

          await deviceStorage.set('user', userBase64);
          await deviceStorage.set('at', state.accessToken);
          await deviceStorage.set('ss', state.sealedSession ?? '');
        } else if (state.status !== 'loaded') {
          console.log('Clearing access token', { state });
          await deviceStorage.delete('user');
          await deviceStorage.delete('at');
          await deviceStorage.delete('ss');
        }
      });
    },
    async signOut() {
      const state = deps.state.getState();
      if (state.status !== 'loaded') return;
      if (!state.sealedSession) return;
      deps.state.setState(() => ({ status: 'loading' }));
      try {
        const redirectUri = AuthSession.makeRedirectUri({ scheme: 'unity-house', path: '/login' });
        await deps.convex.action(api.auth.actions.logout, {
          sealedSession: state.sealedSession,
          returnTo: redirectUri,
        });
        deps.state.setState(() => ({ status: 'idle' }));
        console.log('signOut');
      } catch (error) {
        console.log('signOut error');
        deps.state.setState(() => ({ status: 'error', message: 'Failed to sign out on server' }));
        console.log(error);
      }
    },
    async signIn({
      provider = 'authkit',
      callbackPath = '/auth/callback',
    }: {
      provider: ProviderType;
      callbackPath?: string;
    }) {
      console.log('signIn');
      await handleStartAuthSession({ provider, screenHint: 'sign-in', callbackPath });
    },
    async signUp({
      provider = 'authkit',
      callbackPath = '/auth/callback',
    }: {
      provider: ProviderType;
      callbackPath?: string;
    }) {
      console.log('signUp');
      await handleStartAuthSession({ provider, screenHint: 'sign-up', callbackPath });
    },
  };
}
type ProviderType = 'authkit' | 'GoogleOAuth' | 'MicrosoftOAuth';

async function exchangeCodeForAccessToken(deps: DepType, code: string) {
  console.log('exchangeCodeAsync', code);
  try {
    const auth = await deps.convex.action(api.auth.actions.exchangeCode, { code });
    return auth;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function startAuthSession({
  provider,
  screenHint,
  callbackPath,
}: {
  provider: ProviderType;
  screenHint: 'sign-up' | 'sign-in';
  callbackPath: string;
}) {
  const { authUrl, redirectUri } = buildAuthorizeUrl({ provider, screenHint, callbackPath });
  const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
    // Set true to prevent cookies from being saved when using Google OAuth
    preferEphemeralSession: provider === 'GoogleOAuth',
  });
  console.log({ res });
  if (res.type !== 'success') return null;
  const code = new URL(res.url).searchParams.get('code');
  console.log('startAuthSession', { code });
  if (!code) return null;
  return code;
}

function buildAuthorizeUrl({
  provider,
  screenHint,
  callbackPath,
}: {
  provider: ProviderType;
  screenHint: 'sign-up' | 'sign-in';
  callbackPath: string;
}) {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'unity-house', path: callbackPath });
  const params = new URLSearchParams({
    client_id: clientSafeEnv.EXPO_PUBLIC_WORKOS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    provider,
    ...(provider === 'authkit' ? { screen_hint: screenHint } : {}),
  });

  const baseUrl = 'https://api.workos.com/user_management/authorize';
  // const baseUrl = clientSafeEnv.EXPO_PUBLIC_CONVEX_SITE_URL + '/auth/authorize';
  const authUrl = `${baseUrl}?${params.toString()}`;

  console.log({ authUrl, redirectUri });
  return { authUrl, redirectUri };
}
