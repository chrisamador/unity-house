import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// This is a mock entity type - in a real app, this would come from your Convex schema
interface Entity {
  id: string;
  name: string;
  domainURL: string;
  theme?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}

/**
 * Hook to resolve the current entity based on domain URL
 * This is primarily used for web to support custom domains
 */
export function useEntityFromDomain() {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run this on web platform
    if (Platform.OS !== 'web') {
      setIsLoading(false);
      return;
    }

    async function resolveEntity() {
      try {
        setIsLoading(true);
        
        // Get the current hostname
        const hostname = window.location.hostname;
        
        // In a real app, this would be a Convex query
        // For now, we'll mock the response
        if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
          // For local development, use a mock entity
          setEntity({
            id: 'local-dev',
            name: 'Development Entity',
            domainURL: hostname,
            theme: {
              primaryColor: '#3B82F6',
              logoUrl: '/logo.png',
            },
          });
        } else {
          // In a real app, this would query Convex for an entity with matching domainURL
          // Mock API call with timeout
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock response
          setEntity({
            id: 'entity-1',
            name: 'Example Entity',
            domainURL: hostname,
            theme: {
              primaryColor: '#10B981',
              logoUrl: '/entity-logo.png',
            },
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to resolve entity'));
      } finally {
        setIsLoading(false);
      }
    }

    resolveEntity();
  }, []);

  return { entity, isLoading, error };
}
