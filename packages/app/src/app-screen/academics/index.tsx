import { TextStyled } from '@/ui/components/Text';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AcademicsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Academics' }} />

      {/* Header */}
      <View className="bg-primary-500" style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>

      {/* Content */}
      <View className="container py-6">
        <View className="bg-primary-800/10 p-6 rounded-lg mb-6">
          <TextStyled variant="h2" weight="bold" color="primary" className="mb-4">
            Academic Resources
          </TextStyled>
          <TextStyled className="mb-6">
            Lambda Theta Phi is committed to academic excellence. This section provides resources to
            help brothers succeed in their academic pursuits, including GPA tracking, study guides,
            scholarship opportunities, and mentorship programs.
          </TextStyled>
        </View>

        <View className="space-y-6">
          <ResourceSection
            title="GPA Tracker"
            description="Track your academic performance and set goals for improvement."
            onPress={() => router.push('/academics/gpa-tracker')}
          />
          <TextStyled variant="h4" weight="semibold" color="muted" className="text-center italic">
            More Resources Coming Soon
          </TextStyled>
          <ResourceSection
            title="Scholarship Opportunities"
            description="Information about fraternity scholarships, grants, and external funding opportunities for Latino students."
          />
          <ResourceSection
            title="Study Resources"
            description="Access study guides, academic calendars, and tutoring services available to brothers."
          />
          <ResourceSection
            title="Mentorship Program"
            description="Connect with alumni brothers in your field of study for guidance and career advice."
          />
          <ResourceSection
            title="Academic Achievement"
            description="Recognition of brothers who have demonstrated academic excellence and leadership."
          />
        </View>
      </View>
    </ScrollView>
  );
}

function ResourceSection({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  const isAvailable = !!onPress;

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white border border-gray-200 p-6 rounded-lg flex-row justify-between items-center"
    >
      <View>
        <TextStyled
          color={isAvailable ? 'primary' : 'muted'}
          variant="h3"
          weight="semibold"
          className="mb-2"
        >
          {title}
        </TextStyled>
        <TextStyled color={isAvailable ? 'default' : 'muted'}>{description}</TextStyled>
      </View>
      {isAvailable && (
        <TextStyled color="primary" variant="h4">
          →
        </TextStyled>
      )}
    </Wrapper>
  );
}
