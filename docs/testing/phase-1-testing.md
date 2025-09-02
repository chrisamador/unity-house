# Phase 1: Core Infrastructure Testing Plan

This document outlines the testing approach for Phase 1 of the Unity House implementation, focusing on core infrastructure and user authentication flows.

## Test Strategy Overview

Our testing strategy follows these key principles:

1. **User-Centric Testing**: Focus on testing what matters to users, not implementation details
2. **Minimal but Effective**: Keep tests simple but ensure they verify critical functionality
3. **Automated Where Possible**: Automate tests for core functionality to enable rapid iteration
4. **Visual Verification**: Include visual testing for UI components

## Phase 1A: Project Scaffolding Tests

### User Story Tests

**Test: User can view the Hello World page**

```typescript
// e2e/hello-world.spec.ts
import { test, expect } from '@playwright/test';

test('Hello World page loads correctly', async ({ page }) => {
  // Visit the home page
  await page.goto('/');
  
  // Verify the page contains the Hello World text
  await expect(page.getByText('Hello World')).toBeVisible();
});
```

## Phase 1B: Minimal Backend Tests

### Convex Setup Tests

```typescript
// packages/api/__tests__/convex/setup.test.ts
import { expect, test } from 'vitest';
import { createClient } from '../../convex/client';

test('Convex client can be initialized', () => {
  const client = createClient();
  expect(client).toBeDefined();
});

test('Convex environment variables are properly loaded', () => {
  // This test verifies that environment variables are available
  expect(process.env.CONVEX_URL).toBeDefined();
});
```

### User Schema Tests

```typescript
// packages/api/__tests__/schema/user.test.ts
import { test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import { convexTest } from 'convex-test';
import schema from '../../convex/schema';

test('User schema can store and retrieve user data', async () => {
  // Create a test client with schema
  const t = convexTest(schema);
  
  // Create a test user
  const userId = await t.mutation(api.users.create, {
    name: 'Test User',
    email: 'test@example.com',
    workosId: 'wos_123'
  });
  
  // Retrieve the user
  const user = await t.query(api.users.getById, { id: userId });
  
  // Verify the user data
  expect(user).toMatchObject({
    name: 'Test User',
    email: 'test@example.com',
    workosId: 'wos_123'
  });
});
```

### Authentication Foundation Tests

```typescript
// packages/api/__tests__/auth/utils.test.ts
import { test, expect, vi } from 'vitest';
import { validateAuth } from '../../convex/auth';

test('validateAuth rejects unauthenticated requests', async () => {
  // Mock context with no auth
  const mockContext = { auth: null };
  
  // Should throw error for unauthenticated request
  await expect(validateAuth(mockContext)).rejects.toThrow();
});

test('validateAuth accepts authenticated requests', async () => {
  // Mock context with valid auth
  const mockContext = { auth: { userId: 'user_123' } };
  
  // Should not throw for authenticated request
  await expect(validateAuth(mockContext)).resolves.not.toThrow();
});
```

## Phase 1C: Minimal Frontend Tests

### Expo Setup Tests

```typescript
// packages/app/__tests__/app.test.tsx
import { render } from '@testing-library/react-native';
import App from '../App';

test('App renders without crashing', () => {
  // Mock necessary providers
  vi.mock('../providers/ConvexProvider', () => ({
    ConvexProvider: ({ children }) => <>{children}</>
  }));
  
  // Render the app
  const { getByTestId } = render(<App testID="app-root" />);
  
  // Verify it renders
  expect(getByTestId('app-root')).toBeDefined();
});
```

### UI Foundation Tests

```typescript
// packages/app/__tests__/components/Container.test.tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Container } from '../../components/Container';

test('Container renders children correctly', () => {
  const { getByText } = render(
    <Container>
      <Text>Test Content</Text>
    </Container>
  );
  
  expect(getByText('Test Content')).toBeDefined();
});
```

### Navigation Tests

```typescript
// packages/app/__tests__/navigation/index.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from '../../screens/HomeScreen';

test('Home screen renders correctly', () => {
  const { getByText } = render(
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );
  
  expect(getByText('Home')).toBeDefined();
});
```

## Phase 1D: Authentication Integration Tests

### Auth UI Component Tests

```typescript
// packages/app/__tests__/screens/SignIn.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { SignInScreen } from '../../screens/SignInScreen';

test('Sign in form validates email', async () => {
  const { getByPlaceholderText, getByText, findByText } = render(<SignInScreen />);
  
  // Enter invalid email
  fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
  
  // Submit form
  fireEvent.press(getByText('Sign In'));
  
  // Check for validation message
  expect(await findByText('Please enter a valid email')).toBeDefined();
});
```

### Auth Flow Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('User can sign up and access protected content', async ({ page }) => {
  // Go to sign up page
  await page.goto('/sign-up');
  
  // Fill out sign up form
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email').fill(`test-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('Password123!');
  
  // Submit form
  await page.getByRole('button', { name: 'Sign Up' }).click();
  
  // Verify redirect to protected page
  await expect(page).toHaveURL(/\/dashboard/);
  
  // Verify protected content is visible
  await expect(page.getByText('Welcome')).toBeVisible();
});

test('User can sign in', async ({ page }) => {
  // Go to sign in page
  await page.goto('/sign-in');
  
  // Fill out sign in form
  await page.getByLabel('Email').fill('existing@example.com');
  await page.getByLabel('Password').fill('Password123!');
  
  // Submit form
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Verify redirect to protected page
  await expect(page).toHaveURL(/\/dashboard/);
});

test('User can sign out', async ({ page }) => {
  // Sign in first
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('existing@example.com');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Click sign out button
  await page.getByRole('button', { name: 'Sign Out' }).click();
  
  // Verify redirect to home page
  await expect(page).toHaveURL('/');
  
  // Verify protected routes are no longer accessible
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/sign-in');
});
```

### User Creation Tests

```typescript
// packages/api/__tests__/users/creation.test.ts
import { test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import { convexTest } from 'convex-test';
import schema from '../../convex/schema';

test('User is created on first authentication', async () => {
  const t = convexTest(schema);
  
  // Create authenticated test client with identity
  const asNewUser = t.withIdentity({
    tokenIdentifier: 'workos:wos_new_user',
    name: 'New User',
    email: 'new@example.com'
  });
  
  // Call the onSignIn function that would be triggered by WorkOS
  await asNewUser.mutation(api.users.onSignIn);
  
  // Verify user was created
  const user = await asNewUser.query(api.users.getByWorkOSId, { 
    workosId: 'wos_new_user' 
  });
  
  expect(user).toBeDefined();
  expect(user.name).toBe('New User');
  expect(user.email).toBe('new@example.com');
});
```

## Phase 1E: Basic Testing Infrastructure Tests

### Test Environment Setup Verification

```typescript
// packages/api/__tests__/setup.test.ts
import { expect, test } from 'vitest';

test('Vitest is configured correctly', () => {
  expect(true).toBe(true);
});

test('Test utilities are available', () => {
  // Import test utilities
  const utils = require('../test/utils');
  
  // Verify they exist
  expect(utils).toBeDefined();
});
```

## Test Data Setup

```typescript
// e2e/fixtures/users.ts
export const testUsers = [
  {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass456!'
  }
];
```

## Package Dependencies

```json
// package.json
{
  "devDependencies": {
    "convex-test": "latest",
    "vitest": "latest",
    "@edge-runtime/vm": "latest"
  }
}
```

## Test Execution

### bun Scripts

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:once": "vitest run",
    "test:debug": "vitest --inspect-brk --no-file-parallelism",
    "test:coverage": "vitest run --coverage --coverage.reporter=text",
    "test:backend": "vitest run --dir packages/api",
    "test:frontend": "vitest run --dir packages/app",
    "test:e2e": "playwright test"
  }
}
```

### Running Tests

```bash
# Run tests in watch mode
bun run test

# Run tests once
bun run test:once

# Run tests with debugger
bun run test:debug

# Run tests with coverage report
bun run test:coverage

# Run backend tests only
bun run test:backend

# Run frontend tests only
bun run test:frontend

# Run end-to-end tests
bun run test:e2e
```

## Vitest Configuration

```typescript
// vitest.config.mts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
```

## Manual Test Checklist

### Phase 1A: Project Scaffolding
- [ ] Application can be started with a single command
- [ ] Hello World page is visible in the browser
- [ ] Changes to code automatically reload in the browser
- [ ] README instructions are clear and accurate

### Phase 1B: Minimal Backend
- [ ] Convex dashboard shows the project is connected
- [ ] User schema is visible in Convex dashboard
- [ ] Authentication environment variables are properly loaded

### Phase 1C: Minimal Frontend
- [ ] Application renders on web browser
- [ ] Basic styling is applied correctly
- [ ] Navigation between screens works

### Phase 1D: Authentication Integration
- [ ] User can sign up with email/password
- [ ] User can sign in with email/password
- [ ] User can sign out
- [ ] Protected routes redirect unauthenticated users to sign in
- [ ] User profile is created in Convex on first sign-in

### Phase 1E: Basic Testing
- [ ] All test commands run successfully
- [ ] Test coverage reports are generated
- [ ] CI configuration runs tests automatically
