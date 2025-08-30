import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

// This is the root layout that will be used for all routes
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
      }}
    />
  );
}
