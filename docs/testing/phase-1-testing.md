# Phase 1: Core Infrastructure Testing Plan

This document outlines the testing approach for Phase 1 of the Unity House implementation, focusing on core infrastructure and user authentication flows.

## Test Strategy Overview

Our testing strategy follows these key principles:

1. **Resemble Real Usage**: Tests focus on actual user flows and outcomes users care about
2. **Avoid Implementation Details**: Tests query by accessible attributes, not internal structure
3. **Balanced Test Pyramid**: Primarily integration tests, with targeted unit and E2E tests
4. **Testing Library Principles**: Query elements as users would find them

## Test Coverage by Deliverable

### 1. Project Initialization

**Integration Tests:**

```typescript
// packages/api/__tests__/app.test.ts
import { expect, test } from "vitest";
import { startApp } from "../src/app";

test("application can initialize successfully", async () => {
  // Test real user outcome - app starts without errors
  const app = await startApp();
  
  // Assert on what matters to users - app is running
  expect(app.isRunning()).toBe(true);
});
```

### 2. Basic Backend Setup

**Integration Tests:**

```typescript
// packages/api/convex/__tests__/users.test.ts
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

test("authenticated user can retrieve their profile", async () => {
  const t = convexTest(schema);
  
  // Setup auth as a real user would experience
  t.withAuth({ userId: "user_123" });
  
  // Create test user
  await t.mutation(api.users.createUser, { 
    name: "Ada Lovelace", 
    email: "ada@example.com",
    clerkId: "user_123"
  });
  
  // Test real user flow - getting profile
  const profile = await t.query(api.users.getProfile);
  
  // Assert on what matters to users
  expect(profile.name).toBe("Ada Lovelace");
  expect(profile.email).toBe("ada@example.com");
});

test("unauthenticated users cannot access protected data", async () => {
  const t = convexTest(schema);
  
  // Real scenario: no auth
  
  // Test real outcome: access denied
  await expect(t.query(api.users.getProfile)).rejects.toThrow();
});
```

### 3. Basic Frontend Setup

**Component Tests:**

```typescript
// packages/app/__tests__/components/AuthButton.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthButton } from "../../components/AuthButton";

test("sign in button redirects to sign in page", async () => {
  // Mock navigation as a user would experience it
  const mockNavigate = vi.fn();
  vi.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate })
  }));
  
  // Render component
  render(<AuthButton>Sign In</AuthButton>);
  
  // Interact as a real user
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  
  // Assert on outcome users care about
  expect(mockNavigate).toHaveBeenCalledWith("SignIn");
});
```

### 4. User Authentication

**E2E Tests:**

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("new user can sign up and access dashboard", async ({ page }) => {
  // Test real user flow
  await page.goto("/sign-up");
  
  // Interact as a real user would
  await page.getByLabel(/name/i).fill("New User");
  await page.getByLabel(/email/i).fill("newuser@example.com");
  await page.getByLabel(/password/i).fill("Password123!");
  
  // Submit form as a user would
  await page.getByRole("button", { name: /sign up/i }).click();
  
  // Assert on outcomes users care about
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/welcome, new user/i)).toBeVisible();
});

test("existing user can sign in", async ({ page }) => {
  // Test real user flow
  await page.goto("/sign-in");
  
  // Interact as a real user would
  await page.getByLabel(/email/i).fill("existing@example.com");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  
  // Assert on outcomes users care about
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText(/welcome back/i)).toBeVisible();
});

test("user can sign out", async ({ page }) => {
  // Setup: sign in first
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("existing@example.com");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/dashboard");
  
  // Test real user flow
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  
  // Assert on outcomes users care about
  await expect(page).toHaveURL("/");
  
  // Verify protection as a user would experience
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/sign-in");
});
```

### 5. User Profile Management

**Integration Tests:**

```typescript
// packages/app/__tests__/features/profile.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "../../features/profile/ProfilePage";

test("user can update their profile", async () => {
  // Mock API as needed for integration test
  vi.mock("../../hooks/useProfile", () => ({
    useProfile: () => ({
      profile: { name: "Original Name", email: "user@example.com" },
      updateProfile: vi.fn().mockResolvedValue({ success: true })
    })
  }));
  
  // Render component
  render(<ProfilePage />);
  
  // Verify initial state as user would see it
  expect(screen.getByDisplayValue("Original Name")).toBeInTheDocument();
  
  // Interact as a real user
  await userEvent.clear(screen.getByLabelText(/name/i));
  await userEvent.type(screen.getByLabelText(/name/i), "Updated Name");
  await userEvent.click(screen.getByRole("button", { name: /save/i }));
  
  // Assert on outcomes users care about
  expect(await screen.findByText(/profile updated/i)).toBeInTheDocument();
});
```

**E2E Tests:**

```typescript
// e2e/profile.spec.ts
import { test, expect } from "@playwright/test";

test("user can view and update profile", async ({ page }) => {
  // Setup: sign in first
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("existing@example.com");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  
  // Navigate to profile
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: /profile/i }).click();
  
  // Verify current profile
  await expect(page.getByLabel(/name/i)).toHaveValue("Existing User");
  
  // Update profile
  await page.getByLabel(/name/i).fill("Updated Name");
  await page.getByRole("button", { name: /save/i }).click();
  
  // Assert on outcomes users care about
  await expect(page.getByText(/profile updated/i)).toBeVisible();
  
  // Verify changes persist
  await page.reload();
  await expect(page.getByLabel(/name/i)).toHaveValue("Updated Name");
});
```

## Test Data Setup

```typescript
// e2e/fixtures/auth.setup.ts
import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  // Create a real user session as a user would
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("test@example.com");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  
  // Wait for authentication to complete
  await page.waitForURL("/dashboard");
  
  // Store authentication state
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
```

## Test Execution

```bash
# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run E2E tests
npm run test:e2e
```
