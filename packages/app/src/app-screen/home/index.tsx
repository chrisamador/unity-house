import { useScrollContext } from '@/context/scroll';
import { TextStyled } from '@/ui/components/Text';
import Feather from '@expo/vector-icons/Feather';
import { Animated, Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Events } from './events';
import { Header } from './header';
import { QuickLinks } from './quick-links';
import { Updates } from './updates';

import { Logo } from '@/ui/components/Logo';

import { useAuth } from '@/context/auth';
import { Link, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export function HomeScreen() {
  const { scrollY } = useScrollContext();

  return (
    <Animated.ScrollView
      bounces={false}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16} // for smoother updates
    >
      <Header />
      <QuickLinks />
      <Events />
      <Updates />
    </Animated.ScrollView>
  );
}

export function NavHeaderWithAnimation() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { scrollY } = useScrollContext();
  const { state } = useAuth();

  const isLoggedIn = state.useGetState(s => s.status === 'loaded');

  const pathname = usePathname();
  const isHomeScreen = pathname === '/';

  // Create an animated value for background opacity
  const backgroundOpacityValue = useRef(new Animated.Value(isHomeScreen ? 0 : 1)).current;

  // Animate background opacity when isHome changes
  useEffect(() => {
    Animated.timing(backgroundOpacityValue, {
      toValue: isHomeScreen ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isHomeScreen, backgroundOpacityValue]);

  // Calculate background opacity based on scroll position
  // Start showing background after 20px of scroll, fully opaque at 120px
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 20, 120],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        {
          paddingTop: Math.max(top, 16),
          paddingBottom: 16,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: isHomeScreen
            ? // When on home screen, use scroll-based opacity
              headerBackgroundOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(73, 41, 27, 0)', 'rgba(73, 41, 27, 1)'],
              })
            : // When not on home screen, use solid color with animated opacity for smooth transitions
              backgroundOpacityValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(73, 41, 27, 0.85)', 'rgba(73, 41, 27, 1)'],
              }),
        },
      ]}
    >
      <View className="container">
        <View className="flex-row items-center gap-2 justify-between">
          {/* <View className="md:hidden">
            <Feather name="menu" size={24} color="white" />
          </View> */}
          {/* <TextStyled color="primary" variant="h3" weight="semibold">
        {clientSafeEnv.EXPO_PUBLIC_WEBSITE_TITLE}
      </TextStyled> */}
          <View className="flex-row items-center gap-2">
            {/* <View className="hidden md:flex p-4">
              <Feather name="menu" size={24} color="white" />
            </View> */}
            <Pressable accessibilityRole="link" onPress={() => router.navigate('/')}>
              <Logo />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-6">
            <View className="hidden md:flex flex-row items-center gap-4">
              <Link href="/events">
                <TextStyled className="uppercase tracking-wide" weight="semibold" color="white">
                  Events
                </TextStyled>
              </Link>
              <Link href="/updates">
                <TextStyled className="uppercase tracking-wide" weight="semibold" color="white">
                  Updates
                </TextStyled>
              </Link>
              {!isLoggedIn && (
                <>
                  <Link href="/join">
                    <TextStyled className="uppercase tracking-wide" weight="semibold" color="white">
                      Join
                    </TextStyled>
                  </Link>
                  <Link href="/profile">
                    <TextStyled className="uppercase tracking-wide" weight="semibold" color="white">
                      Login
                    </TextStyled>
                  </Link>
                </>
              )}
            </View>
            <Pressable accessibilityRole="link" onPress={() => router.navigate('/profile')}>
              <ProfilePreview />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function ProfilePreview() {
  const { state } = useAuth();
  const user = state.useGetState(s => (s.status === 'loaded' ? s.user : null));

  if (user?.profilePictureUrl) {
    return (
      <View className="p-2 w-[40px] h-[40px] items-center justify-center bg-white rounded-full">
        <Image source={{ uri: user.profilePictureUrl }} className="w-12 h-12 rounded-full" />
      </View>
    );
  }

  if (user?.firstName && user?.lastName) {
    return (
      <View className="p-2 w-[40px] h-[40px] items-center justify-center bg-white rounded-full">
        <TextStyled variant="body" weight="bold" color="primary">
          {user.firstName[0] + user.lastName[0]}
        </TextStyled>
      </View>
    );
  }

  return (
    <View className="p-2 w-[40px] h-[40px] items-center justify-center bg-white rounded-full">
      <Feather name="user" size={24} color="#49291B" />
    </View>
  );
}

export function NavHeader() {
  const { top } = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === '/';
  return (
    <View
      className={'absolute top-0 left-0 right-0 z-50' + (isHome ? '' : ' bg-primary-500')}
      style={{ paddingTop: Math.max(top, 16), paddingBottom: 16 }}
    >
      <View className="container">
        <View className="flex-row items-center gap-2 justify-between">
          <View className="md:hidden">
            <Feather name="menu" size={24} color="white" />
          </View>
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/')}>
            <Logo />
          </Pressable>
          <View className="flex-row items-center gap-6">
            <View className="hidden md:flex flex-row items-center gap-4">
              <Link href="/authorize">
                <TextStyled className="uppercase tracking-wide" weight="semibold" color="primary">
                  Events
                </TextStyled>
              </Link>
              <Link href="/join">
                <TextStyled className="uppercase tracking-wide" weight="semibold" color="primary">
                  Join
                </TextStyled>
              </Link>
              <Link href="/authorize">
                <TextStyled className="uppercase tracking-wide" weight="semibold" color="primary">
                  Login
                </TextStyled>
              </Link>
            </View>
            <View className="h-12 w-12 bg-white rounded-full" />
          </View>
        </View>
      </View>
    </View>
  );
}
