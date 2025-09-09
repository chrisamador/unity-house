import { TextStyled } from '@/ui/components/Text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/ui/components/Button';

// eslint-disable-next-line import/no-unresolved
import bgImg from '@assets/images/dmvlambdas-bg.jpg';
import { Image } from 'expo-image';

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
        <TextStyled variant="h1" weight="bold" color="primary">
          Leaders of the Latino{' '}
          <TextStyled className="whitespace-nowrap" variant="h1" weight="bold" color="primary">
            Greek Movement
          </TextStyled>
        </TextStyled>
        <View className="opacity-75">
          <TextStyled variant="h4" weight="semibold" color="primary">
            Empowering Latino men through leadership, scholarship, brotherhood, and community
            service
          </TextStyled>
        </View>
        <View className="items-start">
          <Button variant="primary" size="lg" onPress={() => {}}>
            Join Lambda
          </Button>
        </View>
      </View>
    </View>
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
