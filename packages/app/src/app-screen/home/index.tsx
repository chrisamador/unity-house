import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Events } from './events';
import { Header, MenuButton } from './header';
import { QuickLinks } from './quick-links';

export function HomeScreen() {
  return (
    <>
      <NavHeader />
      <ScrollView>
        <Header />
        <QuickLinks />
        <Events />
      </ScrollView>
    </>
  );
}

export function NavHeader() {
  const { top } = useSafeAreaInsets();
  return (
    <View className="absolute top-0 left-0 right-0 z-50" style={{ paddingTop: Math.max(top, 16) }}>
      <View className="container">
        <MenuButton />
      </View>
    </View>
  );
}
