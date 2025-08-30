// packages/api/__tests__/auth/utils.test.ts
import { expect, test } from 'vitest';
import { validateAuth } from '../../convex/auth';

test('validateAuth rejects unauthenticated requests', async () => {
  // Create a mock context with no auth
  const mockCtx = {
    auth: null
  };
  
  // Expect validateAuth to throw an error
  await expect(validateAuth(mockCtx as any)).rejects.toThrow('Unauthorized: Authentication required');
});

test('validateAuth accepts authenticated requests', async () => {
  // Create a mock context with auth that has getUserIdentity method
  const mockCtx = {
    auth: {
      getUserIdentity: async () => ({
        subject: 'user_123',
        tokenIdentifier: 'test:user_123',
        name: 'Test User',
        email: 'test@example.com',
        familyName: 'User',
        issuer: 'https://clerk.unity-house.com'
      })
    }
  };
  
  // Expect validateAuth not to throw
  const result = await validateAuth(mockCtx);
  expect(result.subject).toBe('user_123');
});

test('validateAuth returns user ID for authenticated requests', async () => {
  // Create a mock context with auth that has getUserIdentity method
  const mockCtx = {
    auth: {
      getUserIdentity: async () => ({
        subject: 'user_456',
        tokenIdentifier: 'test:user_456',
        name: 'Another User',
        email: 'another@example.com',
        familyName: 'User',
        issuer: 'https://clerk.unity-house.com'
      })
    }
  };
  
  // Expect validateAuth to return the identity object
  const result = await validateAuth(mockCtx);
  expect(result.subject).toBe('user_456');
});

test('validateAuth rejects requests with missing user ID', async () => {
  // Create a mock context with auth but getUserIdentity returns an identity without subject
  const mockCtx = {
    auth: {
      getUserIdentity: async () => ({
        tokenIdentifier: 'test:missing',
        name: 'Missing ID User',
        email: 'missing@example.com',
        familyName: 'User',
        subject: '', // Empty subject/user ID
        issuer: 'https://clerk.unity-house.com'
      })
    }
  };
  
  // Expect validateAuth to throw an error
  await expect(validateAuth(mockCtx)).rejects.toThrow('Unauthorized: User ID not found');
});
