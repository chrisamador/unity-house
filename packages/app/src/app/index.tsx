import { Button } from '@/ui/components/Button';

import { Image, View } from 'react-native';
import { Card } from '../ui/components/Card';
import { TextStyled } from '../ui/components/Text';

import { useAuth } from '@/context/auth';
import { api } from '@unity-house/api/convex/_generated/api';
import { useConvexAuth, useQuery } from 'convex/react';

import { HomeScreen } from '@/app-screen/home';

export default HomeScreen;

function Index() {
  const { state, actions } = useAuth();
  const user = state.useGetState(s => s);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
      <Card variant="elevated" padding="large" style={{ width: '100%', maxWidth: 400 }}>
        <TextStyled variant="body" color="muted" className="mb-6 text-center dark:text-white">
          Welcome to Unity House 
        </TextStyled>

        <ProfileImage />
        <TextStyled>{user.status}</TextStyled>
        {user.status === 'loading' && <TextStyled variant="body" color="muted" className="mb-6 text-center text-gray-400">Loading...</TextStyled>}
        {user.status === 'error' && <TextStyled variant="body" color="muted" className="mb-6 text-center text-gray-400">{user.message}</TextStyled>}

        {user.status === 'loaded' ? (
          <TextStyled variant="body" color="muted" className="mb-6 text-center text-gray-400">
            You are signed in {user.user.email}
          </TextStyled>
        ) : (
          <TextStyled variant="body" color="muted" className="mb-6 text-center text-gray-400">
            You are NOT signed in
          </TextStyled>
        )}
        {user.status === 'loaded' ? (
          <Button variant="primary" onPress={() => actions.signOut()}>
            Logout
          </Button>
        ) : (
          <SignInButton />
        )}

        {user.status === 'loaded' && <AuthContent />}
      </Card>
    </View>
  );
}

function ProfileImage(){
  const { state } = useAuth();
  const profilePictureUrl = state.useGetState(s => s.status === "loaded" ? s.user.profilePictureUrl : undefined)

  if(!profilePictureUrl){
    return null;
  }
  return (
    <View className="flex items-center">
      <Image
        source={{ uri: profilePictureUrl }}
        className="w-12 h-12 rounded-full"
      />
    </View>
  )
}

function AuthContent() {
const user = useQuery(api.user.queries.whoAmI)
const {isAuthenticated, isLoading} = useConvexAuth();

  return (
    <TextStyled variant="h2" weight="bold" className="mb-2 text-center dark:text-white">
      Hello World {user?.subject ?? "Unknown"} {isAuthenticated ? "Authenticated" : "Not Authenticated"} {isLoading ? "Loading" : "Not Loading"}
    </TextStyled>
  );
}

function SignInButton() {
  const { actions } = useAuth();

  return (
    <View className="flex flex-col gap-2">
      <Button variant="primary" onPress={() => actions.signIn({provider: 'authkit'})}>
        Sign In
      </Button>
      <Button variant="secondary" onPress={() => actions.signUp({provider: 'authkit'})}>
        Sign Up
      </Button>
      <Button variant="outline" onPress={() => actions.signIn({provider: 'GoogleOAuth'})}>
        Sign In with Google
      </Button>
      <Button variant="outline" onPress={() => actions.signIn({provider: 'MicrosoftOAuth'})}>
        Sign In with Microsoft
      </Button>
      <Button variant="ghost" onPress={() => actions.signOut()}>
        Sign Out
      </Button>
    </View>
  );
}
