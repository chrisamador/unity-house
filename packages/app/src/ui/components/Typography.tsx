import { Text, TextProps } from "react-native";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "label";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: "default" | "primary" | "secondary" | "error" | "success" | "warning" | "muted";
}

export function Typography({
  children,
  variant = "body",
  weight = "normal",
  color = "default",
  style,
  ...props
}: TypographyProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "h1":
        return "text-4xl";
      case "h2":
        return "text-3xl";
      case "h3":
        return "text-2xl";
      case "h4":
        return "text-xl";
      case "body":
        return "text-base";
      case "caption":
        return "text-sm";
      case "label":
        return "text-xs";
      default:
        return "text-base";
    }
  };

  const getWeightStyles = () => {
    switch (weight) {
      case "normal":
        return "font-normal";
      case "medium":
        return "font-medium";
      case "semibold":
        return "font-semibold";
      case "bold":
        return "font-bold";
      default:
        return "font-normal";
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case "default":
        return "text-black dark:text-white";
      case "primary":
        return "text-blue-500 dark:text-blue-400";
      case "secondary":
        return "text-green-500 dark:text-green-400";
      case "error":
        return "text-red-500 dark:text-red-400";
      case "success":
        return "text-green-500 dark:text-green-400";
      case "warning":
        return "text-yellow-500 dark:text-yellow-400";
      case "muted":
        return "text-gray-300 dark:text-gray-400";
      default:
        return "text-red-500 dark:text-white";
    }
  };

  return (
    <Text
      className={`${getVariantStyles()} ${getWeightStyles()} ${getColorStyles()}`}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}
