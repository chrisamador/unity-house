import { TextStyled } from '@/ui/components/Text';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForBrothers } from './for-brothers';
import { InterestedGentlemen } from './interested-gentlemen';

export function JoinScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  
  // Set initial tab state from URL parameters or default to 'interest'
  const [activeTab, setActiveTab] = useState<'interest' | 'brothers'>(tab === 'brothers' ? 'brothers' : 'interest');
  
  // Sync with URL parameters when they change
  useEffect(() => {
    if (tab === 'brothers' && activeTab !== 'brothers') {
      setActiveTab('brothers');
    } else if (tab === 'interest' && activeTab !== 'interest') {
      setActiveTab('interest');
    }
  }, [tab, activeTab]);
  
  // Update URL when tab changes
  const handleTabChange = (newTab: 'interest' | 'brothers') => {
    setActiveTab(newTab);
    router.setParams({ tab: newTab });
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Join Lambda Theta Phi' }} />

      {/* Header */}
      <View className='bg-primary-500' style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>
      
      {/* Tabs */}
      <View className="container py-4">
        <View className="flex-row rounded-full overflow-hidden bg-gray-100 p-2">
          <TabButton 
            title="For Interest" 
            isActive={activeTab === 'interest'} 
            onPress={() => handleTabChange('interest')} 
          />
          <TabButton 
            title="For Brothers" 
            isActive={activeTab === 'brothers'} 
            onPress={() => handleTabChange('brothers')} 
          />
        </View>
      </View>

      {/* Content */}
      <View className="container">
        {activeTab === 'interest' ? <InterestedGentlemen /> : <ForBrothers />}
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
      className={`flex-1 py-3 px-6 items-center justify-center ${isActive ? 'bg-white rounded-full' : ''}`}
    >
      <TextStyled 
        color={isActive ? "default" : "muted"} 
        weight="semibold"
      >
        {title}
      </TextStyled>
    </Pressable>
  );
}
