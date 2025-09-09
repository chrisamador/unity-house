import { TextStyled } from '@/ui/components/Text';
import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function UpdatesScreen() {
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Updates' }} />

      {/* Header */}
      <View className='bg-primary-500' style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>

      {/* Content */}
      <View className="container py-6">
        <View className="bg-primary-800/10 p-6 rounded-lg mb-6">
          <TextStyled variant="h2" weight="bold" color="primary" className="mb-4">
            Lambda Updates
          </TextStyled>
          <TextStyled className="mb-6">
            Stay informed with the latest news and announcements from Lambda Theta Phi. This section will provide important updates about chapter activities, national initiatives, and brotherhood achievements.
          </TextStyled>
          <TextStyled variant="h4" weight="semibold" color="muted" className="text-center italic">
            Coming Soon
          </TextStyled>
        </View>

        <View className="space-y-6">
          <UpdatePlaceholder 
            title="National Convention Updates" 
            date="September 15, 2025"
            preview="Information about the upcoming national convention will be posted here."
          />
          <UpdatePlaceholder 
            title="Community Service Initiative" 
            date="September 10, 2025"
            preview="Details about our new community service partnership will be announced soon."
          />
          <UpdatePlaceholder 
            title="Chapter Leadership Elections" 
            date="September 5, 2025"
            preview="Results from the recent chapter leadership elections will be posted here."
          />
        </View>
      </View>
    </ScrollView>
  );
}

function UpdatePlaceholder({ title, date, preview }: { title: string; date: string; preview: string }) {
  return (
    <View className="bg-white border border-gray-200 p-4 rounded-lg">
      <TextStyled variant="label" color="muted" className="mb-1">
        {date}
      </TextStyled>
      <TextStyled variant="h4" weight="semibold" className="mb-2">
        {title}
      </TextStyled>
      <TextStyled color="muted">
        {preview}
      </TextStyled>
    </View>
  );
}
