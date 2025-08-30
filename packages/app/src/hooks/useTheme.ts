import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

// Define theme types
export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
};

export type Theme = {
  dark: boolean;
  colors: ThemeColors;
};

/**
 * Hook to manage theme colors based on system color scheme
 * and optional entity theme overrides
 */
export function useTheme(entityPrimaryColor?: string) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Create the theme object with appropriate colors based on color scheme
  const theme = useMemo<Theme>(() => {
    // Use entity primary color if provided, otherwise use default
    const primaryColor = entityPrimaryColor || (isDark ? '#3B82F6' : '#0B5CD5');
    
    return {
      dark: isDark,
      colors: {
        primary: primaryColor,
        secondary: isDark ? '#10B981' : '#059669',
        background: isDark ? '#000000' : '#FFFFFF',
        card: isDark ? '#1F2937' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#000000',
        border: isDark ? '#374151' : '#E5E7EB',
        notification: '#FF4444',
      },
    };
  }, [colorScheme, entityPrimaryColor, isDark]);

  return theme;
}
