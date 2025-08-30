import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

// Define breakpoints (similar to Tailwind CSS)
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to handle responsive design across different screen sizes
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const responsive = useMemo(() => {
    // Create boolean flags for each breakpoint
    const isSmall = width >= breakpoints.sm;
    const isMedium = width >= breakpoints.md;
    const isLarge = width >= breakpoints.lg;
    const isXLarge = width >= breakpoints.xl;
    const is2XLarge = width >= breakpoints['2xl'];
    
    // Determine current breakpoint
    let currentBreakpoint: Breakpoint = 'sm';
    if (is2XLarge) currentBreakpoint = '2xl';
    else if (isXLarge) currentBreakpoint = 'xl';
    else if (isLarge) currentBreakpoint = 'lg';
    else if (isMedium) currentBreakpoint = 'md';
    
    // Helper function to apply different values based on screen size
    function value<T>(options: { 
      base?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
      '2xl'?: T;
    }): T | undefined {
      if (is2XLarge && options['2xl'] !== undefined) return options['2xl'];
      if (isXLarge && options.xl !== undefined) return options.xl;
      if (isLarge && options.lg !== undefined) return options.lg;
      if (isMedium && options.md !== undefined) return options.md;
      if (isSmall && options.sm !== undefined) return options.sm;
      return options.base;
    }
    
    return {
      width,
      height,
      isSmall,
      isMedium,
      isLarge,
      isXLarge,
      is2XLarge,
      currentBreakpoint,
      value,
    };
  }, [width, height]);
  
  return responsive;
}
