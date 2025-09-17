import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { TextStyled } from './Text';

export interface TextInputProps extends RNTextInputProps {
  label?: React.ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function TextInput({
  label,
  error,
  containerStyle,
  size = 'md',
  placeholder,
  ...props
}: TextInputProps) {
  const sizeStyles = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-3',
    lg: 'py-3 px-4 text-lg',
  };

  return (
    <View style={containerStyle}>
      {typeof label === 'string' && (
        <View className="mb-1">
          <TextStyled weight="semibold">{label}</TextStyled>
        </View>
      )}
      {label && typeof label !== 'string' && <View className="mb-1">{label}</View>}
      <View
        className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md overflow-hidden`}
      >
        <RNTextInput
          className={`${sizeStyles[size]} text-gray-900`}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
      </View>
      {error ? (
        <TextStyled color="error" className="mt-1 text-sm">
          {error}
        </TextStyled>
      ) : null}
    </View>
  );
}
