import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Callback() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();


  }, [])
  return (
    <View>
      <Text>Callback</Text>
    </View>
  );
}
