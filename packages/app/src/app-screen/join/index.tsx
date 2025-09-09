import { TextStyled } from '@/ui/components/Text';
import { Link, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForBrothers } from './for-brothers';
import { InterestedGentlemen } from './interested-gentlemen';

export function JoinScreen() {
  const { top } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'interested' | 'brothers'>('interested');

  return (
    <ScrollView className="flex-1">
      <Stack.Screen options={{ title: 'Join Lambda Theta Phi' }} />

      {/* Header */}
      <View className='bg-primary-500' style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>

      {/* Content */}

      {/* Back button */}
      <View className="container py-2">
        <Link href="/">
          <TextStyled>Back</TextStyled>
        </Link>
      </View>
      <View className="container py-6">
        {activeTab === 'interested' ? <InterestedGentlemen /> : <ForBrothers />}
      </View>
    </ScrollView>
  );
}

function TabButton({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`py-2 px-4 ${isActive ? 'border-b-2 border-white' : ''}`}
    >
      <TextStyled color="primary" weight={isActive ? 'semibold' : 'normal'}>
        {title}
      </TextStyled>
    </Pressable>
  );
}
