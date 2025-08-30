// packages/api/__tests__/schema/user.test.ts
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from "../../convex/_generated/api";
import schema from '../../convex/schema';
import { modules } from "../../test.setup";


test('User schema can store and retrieve user data', async () => {
  // Create a test client with schema
  const testClient = convexTest(schema, modules);
 
  
  // Create a test user directly in the database
  const userId = await testClient.mutation(api.users.create, {
    name: "Test User",
    email: "test@example.com",
    clerkId: "clerk_123",
  })
  
  // Retrieve the user directly from the database
  const user = await testClient.query(api.users.getById, {
    id: userId,
  });
  
  // Verify the user data
  expect(user).toMatchObject({
    firstName: 'Test User',
    clerkId: 'clerk_123'
  });
});
