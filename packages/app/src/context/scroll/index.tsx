import { usePathname } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface ScrollContextType {
  scrollY: Animated.Value;
  headerOpacity: Animated.Value;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within a ScrollProvider');
  }
  return context;
}

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const pathname = usePathname();
  const isHomeScreen = pathname === '/';

  // Animate header opacity when isHomeScreen changes
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: isHomeScreen ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isHomeScreen, headerOpacity]);

  return (
    <ScrollContext.Provider value={{ scrollY, headerOpacity }}>
      {children}
    </ScrollContext.Provider>
  );
}
