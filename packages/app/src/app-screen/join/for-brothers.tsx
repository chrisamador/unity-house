import { useAuth } from '@/context/auth';
import { Button } from '@/ui/components/Button';
import { TextStyled } from '@/ui/components/Text';
import React from 'react';
import { View } from 'react-native';

export function ForBrothers() {
  const { state, actions } = useAuth();

  const user = state.useGetState(s => s);

  return (
    <View className="space-y-6">
      <View>
        <TextStyled variant="h3" weight="bold" className="mb-2">
          Brother Registration
        </TextStyled>
        <TextStyled className="mb-4">
          Select a method to register as a brother of Lambda Theta Phi. Your information will be
          verified by your sector and or chapter leadership.
        </TextStyled>
      </View>

      <View className="flex-1 bg-primary-800/10 items-center justify-center p-6 rounded-lg gap-4">
        {user.status === 'loading' && <Loading />}
        {user.status === 'loaded' && <LoggedIn />}
        {(user.status === 'error' || user.status === 'idle') && <SignUp />}
      </View>
    </View>
  );
}

function Loading() {
  return (
    <TextStyled color="primary" weight="bold">
      Loading...
    </TextStyled>
  );
}

function LoggedIn() {
  const { state } = useAuth();
  const email = state.useGetState(s => (s.status === 'loaded' ? s.user.email : null));

  return (
    <>
      <TextStyled color="primary" weight="bold">
        You are logged in
      </TextStyled>
      <TextStyled>{email}</TextStyled>
      <Button variant="primary" onPress={() => {}}>
        Go to Profile
      </Button>
    </>
  );
}

function SignUp() {
  const { actions } = useAuth();
  return (
    <View className="w-full gap-2">
      <Button variant="secondary" onPress={() => actions.signIn({ provider: 'GoogleOAuth' })}>
        Sign Up with Google
      </Button>
      <Button variant="primary" onPress={() => actions.signUp({ provider: 'authkit' })}>
        Sign Up with Email
      </Button>
      <View className="h-2 border-b border-primary-600/40 mb-2 " />
      <Button variant="outline" onPress={() => actions.signIn({ provider: 'authkit' })}>
        Sign In
      </Button>
    </View>
  );
}
