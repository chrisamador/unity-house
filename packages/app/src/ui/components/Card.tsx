import { View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "small" | "medium" | "large";
}

export function Card({
  children,
  style,
  variant = "default",
  padding = "medium",
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "default":
        return "bg-white dark:bg-gray-800";
      case "elevated":
        return "bg-white dark:bg-gray-800 shadow-md";
      case "outlined":
        return "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
      default:
        return "bg-white dark:bg-gray-800";
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case "none":
        return "p-0";
      case "small":
        return "p-2";
      case "medium":
        return "p-4";
      case "large":
        return "p-6";
      default:
        return "p-4";
    }
  };

  return (
    <View
      className={`rounded-lg ${getVariantStyles()} ${getPaddingStyles()}`}
      style={style}
    >
      {children}
    </View>
  );
}
