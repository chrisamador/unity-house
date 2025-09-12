import { TextStyled } from '@/ui/components/Text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/ui/components/Button';

import { useAuth } from '@/context/auth';

// eslint-disable-next-line import/no-unresolved
import bgImg from '@assets/images/dmvlambdas-bg.jpg';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

export function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View
      className="bg-primary-500"
      style={{
        //   paddingTop: Math.max(top, 16),
        //   paddingBottom: 16,
        //   borderTopLeftRadius: top,
        //   borderTopRightRadius: top,
        //   borderBottomLeftRadius: 8,
        //   borderBottomRightRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Background source={bgImg}>
        <View
          style={{ paddingTop: Math.max(top, 16), paddingBottom: 32 }}
          className="h-[480px] web:h-[600px]"
        >
          <Slide />
        </View>
      </Background>
    </View>
  );
}

function Slide() {
  return (
    <View className="container flex-1 justify-end">
      <View className="flex gap-4 max-w-[600px]">
        <Headline />
        <View className="opacity-75">
          <SubHeadline />
        </View>
        <View className="items-start">
          <CallToAction />
        </View>
      </View>
    </View>
  );
}

function Headline() {
  const { state } = useAuth();
  const userName = state.useGetState(s => (s.status === 'loaded' ? s.user.firstName : null));

  const timeOfDay = new Date().getHours();
  const greeting =
    timeOfDay < 12 ? 'Good Morning' : timeOfDay < 18 ? 'Good Afternoon' : 'Good Evening';

  if (userName) {
    return (
      <TextStyled variant="h1" weight="bold" color="white">
        {greeting} {userName}
      </TextStyled>
    );
  }

  return (
    <TextStyled variant="h1" weight="bold" color="white">
      Leaders of the Latino{' '}
      <TextStyled className="whitespace-nowrap" variant="h1" weight="bold" color="white">
        Greek Movement
      </TextStyled>
    </TextStyled>
  );
}

function SubHeadline() {
  const { state } = useAuth();
  const userName = state.useGetState(s => (s.status === 'loaded' ? s.user.firstName : null));

  if (userName) {
    return null;
    // return (
    //   <TextStyled variant="h4" weight="semibold" color="white">
    //     You have 2 new updates to review
    //   </TextStyled>
    // );
  }

  return (
    <TextStyled variant="h4" weight="semibold" color="white">
      Empowering Latino men through leadership, scholarship, brotherhood, and community service
    </TextStyled>
  );
}

function CallToAction() {
  const router = useRouter();

  const { state } = useAuth();
  const userName = state.useGetState(s => s.status === 'loaded');

  if (userName) {
    return (
      <Button
        variant="primary"
        size="lg"
        onPress={() => {
          router.navigate('/profile');
        }}
      >
        View Profile
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onPress={() => {
        router.navigate('/join');
      }}
    >
      Join Lambda
    </Button>
  );
}

export function Background({
  source,
  children,
  className,
  blur = 0,
}: {
  source: string | number; // remote URL or require(...)
  children?: React.ReactNode;
  className?: string; // NativeWind classes for the container
  blur?: number;
}) {
  return (
    <View className={['relative overflow-hidden', className].join(' ')}>
      <Image
        source={source}
        // fill + cover = CSS background-size: cover
        style={{ position: 'absolute', inset: 0 }}
        contentFit="cover"
        blurRadius={blur}
        cachePolicy="disk"
      />
      {/* Optional overlay tint */}
      <View className="absolute inset-0 bg-black/10" />
      {/* Foreground content */}
      <View className="relative">{children}</View>
    </View>
  );
}
