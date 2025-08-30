// packages/api/__tests__/users/creation.test.ts
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from "../../convex/_generated/api";
import schema from '../../convex/schema';
import { modules } from "../../test.setup";

test('User can be created with authentication data', async () => {
  const testClient = convexTest(schema, modules);
  
  // Create a test user directly in the database
  const userId = await testClient.mutation(api.users.create, {
    name: 'New User',
    email: 'newuser@example.com',
    clerkId: 'clerk_new_user',
  });
  
  // Verify user was created
  const user = await testClient.query(api.users.getById, {
    id: userId,
  });
  
  expect(user).toBeDefined();
  expect(user.firstName).toBe('New User');
  expect(user.clerkId).toBe('clerk_new_user');
});
  
