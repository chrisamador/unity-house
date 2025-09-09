import { AuthProvider, useAuth } from '@/context/auth';
import { LoadedAuthStateType } from '@/context/auth/types';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

import { NavHeaderWithAnimation } from '@/app-screen/home';
import { ScrollProvider } from '@/context/scroll';
import { useAppFonts } from '@/hooks/use-app-fonts';
import * as SplashScreen from 'expo-splash-screen';
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

// Have status bar text white
StatusBar.setBarStyle('light-content');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// This is the root layout that will be used for all routes
export default function RootLayout() {
  // Load fonts using the useAppFonts hook
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Hide splash screen when fonts are loaded
    async function hideSplashScreen() {
      if (fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error(new Error(`Error hiding splash screen: ${error}`));
        }
      }
    }

    hideSplashScreen();
  }, [fontsLoaded]);

  return (
    <AuthProvider convex={convex}>
      <ScrollProvider>
        <ConvexProviderWithAuthContext>
          {Platform.OS === 'web' && (
            <Head>
              <title>{clientSafeEnv.EXPO_PUBLIC_WEBSITE_TITLE}</title>
            </Head>
          )}
          <NavHeaderWithAnimation />
          <Stack
            screenOptions={{
              title: 'Unity House',
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'slide_from_left' }} />
          </Stack>
        </ConvexProviderWithAuthContext>
      </ScrollProvider>
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

        if (!res.ok) {
          throw new Error('Failed to get access token');
        }

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
          };
        });
        return data.accessToken ?? null;
      } catch (error) {
        console.log('fetchAccessToken error', error);
        state.setState(() => {
          return {
            status: 'error',
            message: 'Failed to get access token',
          };
        });
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
