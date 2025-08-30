import { View, Text, TextInput, TextInputProps } from "react-native";
import { useState } from "react";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({
  label,
  error,
  helper,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 text-black dark:text-white ${
          error
            ? "border-red-500"
            : isFocused
            ? "border-blue-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#9CA3AF"
        {...props}
        style={[{ fontSize: 16 }, style]}
      />
      {error ? (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      ) : helper ? (
        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
