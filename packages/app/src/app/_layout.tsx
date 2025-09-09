import { AuthProvider, useAuth } from '@/context/auth';
import { LoadedAuthStateType } from '@/context/auth/types';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { clientSafeEnv } from '../env';
import '../ui/styles/global.css';
const convex = new ConvexReactClient(clientSafeEnv.EXPO_PUBLIC_CONVEX_DEPLOYMENT_URL, {
  unsavedChangesWarning: false,
  // logger: {
  //   logVerbose(...args: any[]){
  //     console.log("[CONVEX]",...args)
  //   },
  //   log(...args: any[]){
  //     console.log("[CONVEX]",...args)
  //   },
  //   warn(...args: any[]){
  //     console.log("[CONVEX]",...args)
  //   },
  //   error(...args: any[]){
  //     console.log("[CONVEX]",...args)
  //   },
  // }
});

// This is the root layout that will be used for all routes
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider convex={convex}>
      <ConvexProviderWithAuthContext>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
            },
          }}
        />
      </ConvexProviderWithAuthContext>
    </AuthProvider>
  );
}

function ConvexProviderWithAuthContext({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthContext}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useAuthContext() {
  const { state } = useAuth();
  const isLoading = state.useGetState(s => s.status === 'loading');
  const isAuthenticated = state.useGetState(s => s.status === 'loaded');

  console.log('useAuthContext', { isLoading, isAuthenticated });
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean }) => {
      const authState = state.getState();
      if (authState.status !== 'loaded' || !authState.sealedSession) {
        return null;
      }
      try {
        console.log('fetchAccessToken', {
          sealedSession: !!authState.sealedSession,
          forceRefreshToken,
        });
        // convex.action(api.auth.actions.getAccessToken, {
        //   sealedSession: authState.sealedSession,
        //   forceRefreshToken,
        // }).then((token) => {
        //   console.log('fetchAccessToken success', {
        //     newToken: !!token,
        //   });
        // }).catch((error) => {
        //   console.log('fetchAccessToken error', error);
        // });
        // const tokenRes  = await convex.action(api.auth.actions.getAccessToken, {
        //   sealedSession: authState.sealedSession,
        //   forceRefreshToken,
        // })
        // console.log({ tokenRes });
        const url = `${clientSafeEnv.EXPO_PUBLIC_CONVEX_SITE_URL}/auth/at`;
        console.log({ url });
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sealedSession: authState.sealedSession,
            forceRefreshToken,
          }),
        });

        const data = (await res.json()) as {
          accessToken: LoadedAuthStateType['accessToken'] | null;
          user: LoadedAuthStateType['user'] | null;
          sealedSession: LoadedAuthStateType['sealedSession'] | null;
          authenticated: boolean;
        };

        state.setState(() => {
          if (data.authenticated && data.accessToken && data.sealedSession && data.user) {
            return {
              status: 'loaded',
              accessToken: data.accessToken,
              user: data.user,
              sealedSession: data.sealedSession,
            };
          }
          return {
            status: 'error',
            message: 'Failed to get access token',
          }
        });
        return data.accessToken ?? null;
      } catch (error) {
        console.log('fetchAccessToken error', error);
        return null;
      }
    },
    [state]
  );

  // return useMemo(
  //   () => ({
  //     isLoading,
  //     isAuthenticated,
  //     fetchAccessToken,
  //   }),
  //   [isLoading, isAuthenticated, fetchAccessToken]
  // );
  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken,
  };
}
