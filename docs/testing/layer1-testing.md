# Layer 1: Core Infrastructure Testing Plan

This document outlines the testing approach for Layer 1 of the Unity House implementation, focusing on core infrastructure and user authentication flows.

## Backend Tests (Convex-test with Vitest)

### Authentication Tests

```typescript
// packages/api/convex/__tests__/auth.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

test("user can be created after authentication", async () => {
  const t = convexTest(schema);
  
  // Mock the Clerk authentication
  t.withAuth({ userId: "user_123" });
  
  // Call the user creation function that would be triggered after Clerk auth
  const userId = await t.mutation(api.users.createUser, { 
    name: "Test User", 
    email: "test@example.com",
    clerkId: "user_123"
  });
  
  // Verify the user was created
  const user = await t.query(api.users.getUser, { clerkId: "user_123" });
  expect(user).toMatchObject({
    name: "Test User",
    email: "test@example.com",
    clerkId: "user_123"
  });
});

test("unauthenticated users cannot access protected data", async () => {
  const t = convexTest(schema);
  
  // No auth context set
  
  // Attempt to access protected data should fail
  await expect(
    t.query(api.users.listUsers)
  ).rejects.toThrow();
});
```

### User Profile Tests

```typescript
// packages/api/convex/__tests__/userProfile.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

test("user can update their profile", async () => {
  const t = convexTest(schema);
  
  // Create a test user
  t.withAuth({ userId: "user_123" });
  const userId = await t.mutation(api.users.createUser, { 
    name: "Original Name", 
    email: "test@example.com",
    clerkId: "user_123"
  });
  
  // Update the user profile
  await t.mutation(api.users.updateProfile, {
    name: "Updated Name",
  });
  
  // Verify the profile was updated
  const user = await t.query(api.users.getUser, { clerkId: "user_123" });
  expect(user.name).toBe("Updated Name");
  expect(user.email).toBe("test@example.com"); // Unchanged
});
```

## End-to-End Tests (Playwright)

### Authentication Flows

```typescript
// e2e/auth.spec.ts
import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('new user can sign up', async ({ page }) => {
    // Navigate to sign up page
    await page.goto('/sign-up');
    
    // Fill in sign up form
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    
    // Submit form
    await page.click('[data-testid="sign-up-button"]');
    
    // Should redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/onboarding|\/dashboard/);
  });
  
  test('existing user can sign in', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/sign-in');
    
    // Fill in sign in form
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    
    // Submit form
    await page.click('[data-testid="sign-in-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user name in header
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Existing User');
  });
  
  test('user can sign out', async ({ page }) => {
    // Start as signed in user
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
    
    // Click sign out button
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="sign-out-button"]');
    
    // Should redirect to home or sign in page
    await expect(page).toHaveURL(/\/|\/sign-in/);
    
    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
  });
});
```

### Navigation Tests

```typescript
// e2e/navigation.spec.ts
import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('unauthenticated user sees correct navigation options', async ({ page }) => {
    // Visit home page
    await page.goto('/');
    
    // Should see sign in and sign up links
    await expect(page.locator('[data-testid="sign-in-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="sign-up-link"]')).toBeVisible();
    
    // Should not see dashboard link
    await expect(page.locator('[data-testid="dashboard-link"]')).not.toBeVisible();
  });
  
  test('authenticated user sees correct navigation options', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
    
    // Should see dashboard and profile links
    await expect(page.locator('[data-testid="dashboard-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible();
    
    // Should not see sign in link
    await expect(page.locator('[data-testid="sign-in-link"]')).not.toBeVisible();
  });
  
  test('mobile navigation menu works', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Visit home page
    await page.goto('/');
    
    // Mobile menu should be hidden initially
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Should see navigation links
    await expect(page.locator('[data-testid="sign-in-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="sign-up-link"]')).toBeVisible();
  });
});
```

### Profile Management Tests

```typescript
// e2e/profile.spec.ts
import { test, expect } from './fixtures';

test.describe('Profile Management', () => {
  test('user can view their profile', async ({ userContext: page }) => {
    // Navigate to profile page
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="profile-link"]');
    
    // Should show profile information
    await expect(page.locator('[data-testid="profile-name"]')).toContainText('Existing User');
    await expect(page.locator('[data-testid="profile-email"]')).toContainText('existing@example.com');
  });
  
  test('user can update their profile', async ({ userContext: page }) => {
    // Navigate to profile page
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="profile-link"]');
    
    // Click edit button
    await page.click('[data-testid="edit-profile-button"]');
    
    // Update name
    await page.fill('[data-testid="name-input"]', 'Updated Name');
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should show updated name
    await expect(page.locator('[data-testid="profile-name"]')).toContainText('Updated Name');
  });
});
```

## Test Data Setup

For backend tests, we'll create a helper to set up test data:

```typescript
// packages/api/convex/__tests__/helpers/setupTestData.ts
import { convexTest } from "convex-test";
import { api } from "../../_generated/api";
import schema from "../../schema";

export async function setupTestUser(t) {
  t.withAuth({ userId: "test_user_id" });
  const userId = await t.mutation(api.users.createUser, {
    name: "Test User",
    email: "test@example.com",
    clerkId: "test_user_id"
  });
  return userId;
}
```

For E2E tests, we'll create a global setup file:

```typescript
// e2e/global-setup.ts
import { chromium } from '@playwright/test';

async function globalSetup() {
  // Set up a browser
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Create test users via API or direct database access
  // This would typically use an admin API to set up test data
  
  await browser.close();
}

export default globalSetup;
```

## Running Tests

To run the tests for Layer 1:

```bash
# Run backend tests
bun run test:backend

# Run E2E tests
bun run test:e2e

# Run all tests
bun run test
```
