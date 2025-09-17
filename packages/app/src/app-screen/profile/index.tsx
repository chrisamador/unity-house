import { useAuth } from '@/context/auth';
import { Button } from '@/ui/components/Button';
import { TextStyled } from '@/ui/components/Text';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { state, actions } = useAuth();
  const user = state.useGetState(s => (s.status === 'loaded' ? s.user : null));
  const isLoading = state.useGetState(s => s.status === 'loading');
  
  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'My Profile' }} />

      {/* Header */}
      <View className="bg-primary-500" style={{ paddingTop: top }}>
        <View className="h-[60px] web:h-[80px]" />
      </View>

      {/* Content */}
      <View className="container py-6">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <TextStyled variant="h2" weight="bold" color="primary">
              Loading...
            </TextStyled>
          </View>
        ) : user ? (
          <LoggedInProfile user={user} onSignOut={actions.signOut} />
        ) : (
          <NotLoggedInView onSignIn={() => actions.signIn({ provider: 'authkit' })} />
        )}
      </View>
    </ScrollView>
  );
}

function LoggedInProfile({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  return (
    <View className="space-y-6">
      <View className="bg-primary-800/10 p-6 rounded-lg">
        <TextStyled variant="h2" weight="bold" color="primary" className="mb-4">
          My Profile
        </TextStyled>
        <View className="space-y-4">
          <ProfileField label="Name" value={`${user.firstName || ''} ${user.lastName || ''}`} />
          <ProfileField label="Email" value={user.email || ''} />
          <ProfileField label="Member Since" value="Coming Soon" />
          <ProfileField label="Chapter" value="Coming Soon" />
        </View>
      </View>

      <View className="bg-white border border-gray-200 p-6 rounded-lg">
        <TextStyled variant="h3" weight="semibold" className="mb-4">
          Profile Features
        </TextStyled>
        <TextStyled className="mb-6">
          Additional profile features will be available soon, including:
        </TextStyled>
        <View className="space-y-2 mb-6">
          <FeatureItem text="Profile photo and customization" />
          <FeatureItem text="Membership status and history" />
          <FeatureItem text="Achievement badges and recognition" />
          <FeatureItem text="Communication preferences" />
        </View>
        <TextStyled
          variant="h4"
          weight="semibold"
          color="muted"
          className="text-center italic mb-6"
        >
          Coming Soon
        </TextStyled>
        <Button variant="outline" onPress={onSignOut}>
          Sign Out
        </Button>
      </View>
    </View>
  );
}

function NotLoggedInView({ onSignIn }: { onSignIn: () => void }) {
  const router = useRouter();
  return (
    <View className="bg-primary-800/10 p-6 rounded-lg items-center gap-6">
      <TextStyled variant="h3" weight="bold" color="primary" className="mb-4">
        Sign In Required
      </TextStyled>
      <TextStyled className="text-center">
        Please sign in to view and manage your profile information.
      </TextStyled>
      <View className="w-full items-stretch gap-2">
        <Button variant="primary" onPress={onSignIn}>
          Sign In
        </Button>
        <Button variant="outline" onPress={() => router.push('/join')}>
          Join
        </Button>
      </View>
    </View>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <TextStyled variant="label" color="muted">
        {label}
      </TextStyled>
      <TextStyled weight="semibold">{value}</TextStyled>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row">
      <View className="w-2 h-2 mt-2 mr-2 rounded-full bg-primary-500" />
      <TextStyled className="flex-1">{text}</TextStyled>
    </View>
  );
}
