import { TextStyled } from '@/ui/components/Text';
import { View } from 'react-native';

export function Events() {
  return (
    <View className="container">
      <TextStyled variant="h2" weight="bold">
        Events
      </TextStyled>
      <View>
        <TextStyled weight="bold">
          Upcoming Events
        </TextStyled>
      </View>
    </View>
  );
}
