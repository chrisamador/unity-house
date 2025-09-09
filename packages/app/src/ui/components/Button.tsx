import { ActivityIndicator, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  className = "",
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-primary-900 border-transparent";
      case "secondary":
        return "bg-primary-500 border-transparent";
      case "outline":
        return "bg-transparent border-primary-500";
      case "ghost":
        return "bg-transparent border-transparent";
      default:
        return "bg-blue-500 border-transparent";
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case "primary":
        return "text-primary-400";
      case "secondary":
        return "text-white";
      case "outline":
        return "text-primary-500";
      case "ghost":
        return "text-primary-500";
      default:
        return "text-white";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "py-1 px-3";
      case "md":
        return "py-2 px-4";
      case "lg":
        return "py-3 px-6";
      default:
        return "py-2 px-4";
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "md":
        return "text-base";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center rounded-lg border ${getSizeStyles()} ${getVariantStyles()} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" || variant === "secondary" ? "white" : "#3B82F6"} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`font-medium ${getTextSizeStyles()} ${getTextStyles()}`} style={textStyle}>
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
