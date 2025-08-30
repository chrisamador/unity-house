// packages/api/__tests__/convex/setup.test.ts
import { expect, test, vi } from 'vitest';
import { createClient } from '../../convex/client';

// Mock environment variables for testing
vi.stubEnv('CONVEX_URL', 'https://example-test.convex.cloud');

test('Convex client can be initialized', () => {
  const client = createClient();
  expect(client).toBeDefined();
});

test('Convex environment variables are properly loaded', () => {
  // This test verifies that environment variables are available
  expect(process.env.CONVEX_URL).toBeDefined();
  expect(process.env.CONVEX_URL).toBe('https://example-test.convex.cloud');
});
