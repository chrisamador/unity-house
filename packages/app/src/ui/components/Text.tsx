import { Text, TextProps } from "react-native";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "label";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: "default" | "primary" | "secondary" | "error" | "success" | "warning" | "muted";
}

export function TextStyled({
  children,
  variant = "body",
  weight = "normal",
  color = "default",
  style,
  className = "",
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
        return "font-montserrat-regular";
      case "medium":
        return "font-montserrat-medium";
      case "semibold":
        return "font-montserrat-semibold";
      case "bold":
        return "font-montserrat-bold";
      default:
        return "font-montserrat-regular";
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case "default":
        return "text-black";
      case "primary":
        return "text-white";
      case "secondary":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "muted":
        return "text-gray-500";
      default:
        return "text-red-500";
    }
  };

  return (
    <Text
      className={`${getVariantStyles()} ${getWeightStyles()} ${getColorStyles()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}
