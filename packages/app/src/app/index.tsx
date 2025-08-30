import { View } from "react-native";
import { Card } from "../ui/components/Card";
import { Typography } from "../ui/components/Typography";

export default function Index() {

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
      <Card variant="elevated" padding="large" style={{ width: '100%', maxWidth: 400 }}>
        <Typography variant="h2" weight="bold" className="mb-2 text-center">
          Hello World
        </Typography>
        
        <Typography variant="body" color="muted" className="mb-6 text-center">
          Welcome to Unity House
        </Typography>
        
       
      </Card>
    </View>
  );
}
