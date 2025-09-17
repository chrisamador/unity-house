import { useAuth } from '@/context/auth';
import { TextStyled } from '@/ui/components/Text';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import components
import { GPADisplay } from './components/GPADisplay';
import { GradeEntry } from './components/GradeEntry';
import { SyllabusUploadV2 } from './components/SyllabusUploadV2';
import { UserManagement } from './components/UserManagement';

export function GPATrackerScreen() {
  const { top } = useSafeAreaInsets();
  const { state } = useAuth();
  const user = state.useGetState(s => s);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabi' | 'grades' | 'admin'>(
    'overview'
  );

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'GPA Tracker' }} />

      {/* Header */}
      <View className="bg-primary-500" style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>

      {/* Content */}
      <View className="container py-6">
        <TextStyled variant="h2" weight="bold" color="primary" className="mb-4">
          GPA Tracker
        </TextStyled>
        {/* <View className="bg-primary-800/10 p-6 rounded-lg mb-6">
          <TextStyled className="mb-6">
            Upload your course syllabi, track assignments, enter grades, and monitor your academic
            performance. Our AI-powered system will extract course information and assignments
            automatically.
          </TextStyled>
        </View> */}

        {/* Loading state */}
        {user.status === 'loading' && (
          <View className="items-center justify-center py-8">
            <TextStyled>Loading...</TextStyled>
          </View>
        )}

        {/* Authenticated content */}
        {user.status === 'loaded' && (
          <View className="gap-6">
            {/* Tab Navigation */}
            <View className="flex-row border-b border-gray-200">
              <TabButton
                label="Overview"
                isActive={activeTab === 'overview'}
                onPress={() => setActiveTab('overview')}
              />
              <TabButton
                label="Grades"
                isActive={activeTab === 'grades'}
                onPress={() => setActiveTab('grades')}
              />
              <TabButton
                label="Syllabi"
                isActive={activeTab === 'syllabi'}
                onPress={() => setActiveTab('syllabi')}
              />
              {user.status === 'loaded' && user.user.memberType === 'admin' && (
                <TabButton
                  label="Admin"
                  isActive={activeTab === 'admin'}
                  onPress={() => setActiveTab('admin')}
                />
              )}
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && <GPADisplay />}
            {activeTab === 'syllabi' && <SyllabusUploadV2 />}
            {activeTab === 'grades' && <GradeEntry />}
            {activeTab === 'admin' && <UserManagement />}
          </View>
        )}

        {/* Not authenticated */}
        {(user.status === 'error' || user.status === 'idle') && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <TextStyled variant="h4" weight="semibold" className="mb-2">
              Sign In Required
            </TextStyled>
            <TextStyled>Please sign in to access the GPA Tracker features.</TextStyled>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`py-3 px-4 ${isActive ? 'border-b-2 border-primary-500' : ''}`}
    >
      <TextStyled
        weight={'semibold'}
        color={isActive ? 'primary' : 'muted'}
      >
        {label}
      </TextStyled>
    </Pressable>
  );
}
