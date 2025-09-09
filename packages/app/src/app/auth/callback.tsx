import { TextStyled } from '@/ui/components/Text';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function Callback() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);
  
  return (
    <View>
      <TextStyled>Loading...</TextStyled>
    </View>
  );
}
