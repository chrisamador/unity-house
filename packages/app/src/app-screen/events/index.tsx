import { TextStyled } from '@/ui/components/Text';
import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function EventsScreen() {
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Events' }} />

      {/* Header */}
      <View className='bg-primary-500' style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>

      {/* Content */}
      <View className="container py-6">
        <View className="bg-primary-800/10 p-6 rounded-lg mb-6">
          <TextStyled variant="h2" weight="bold" color="primary" className="mb-4">
            Upcoming Events
          </TextStyled>
          <TextStyled className="mb-6">
            Stay tuned for upcoming events from Lambda Theta Phi. Our calendar will be updated regularly with chapter meetings, social events, community service opportunities, and more.
          </TextStyled>
          <TextStyled variant="h4" weight="semibold" color="muted" className="text-center italic">
            Coming Soon
          </TextStyled>
        </View>

        <View className="bg-white border border-gray-200 p-6 rounded-lg">
          <TextStyled variant="h3" weight="bold" className="mb-4">
            Event Features
          </TextStyled>
          <View className="space-y-4">
            <FeatureItem 
              title="Event Calendar" 
              description="View and filter events by date, type, and location." 
            />
            <FeatureItem 
              title="RSVP System" 
              description="Easily RSVP to events and see who else is attending." 
            />
            <FeatureItem 
              title="Event Reminders" 
              description="Get notifications about upcoming events you're interested in." 
            />
            <FeatureItem 
              title="Event Photos" 
              description="Access photo galleries from past events." 
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View className="flex-row">
      <View className="w-2 h-2 mt-2 mr-2 rounded-full bg-primary-500" />
      <View className="flex-1">
        <TextStyled weight="semibold">{title}</TextStyled>
        <TextStyled color="muted">{description}</TextStyled>
      </View>
    </View>
  );
}
