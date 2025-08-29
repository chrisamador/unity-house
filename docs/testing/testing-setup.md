# Unity House Testing Setup

This document outlines the testing approach for the Unity House application, focusing on user flows and expectations rather than implementation details.

## Testing Philosophy

Our testing approach follows these principles:

1. **User-centric**: Tests should validate user flows and expectations, not implementation details
2. **Behavior-driven**: Tests should describe the expected behavior of the application
3. **Maintainable**: Tests should be easy to understand and maintain
4. **Fast**: Tests should run quickly to provide rapid feedback

## Testing Tools

### End-to-End Testing with Playwright

We use Playwright for end-to-end testing to validate complete user flows across the application.

#### Setup

```bash
# Install Playwright
bun add -D @playwright/test

# Install browsers
npx playwright install
```

#### Configuration

Create a `playwright.config.ts` file in the root directory:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Backend Testing with Convex-test and Vitest

We use Convex-test with Vitest for testing the Convex backend functions.

#### Setup

```bash
# Install dependencies
bun add -D convex-test vitest @edge-runtime/vm
```

#### Configuration

Create a `vitest.config.mts` file in the root directory:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
```

## Test Directory Structure

```
unity-house/
├── e2e/                      # End-to-end tests with Playwright
│   ├── auth.spec.ts          # Authentication flows
│   ├── organizations.spec.ts # Organization management flows
│   └── ...
├── packages/
│   ├── api/
│   │   ├── convex/
│   │   │   ├── __tests__/    # Backend tests with Convex-test
│   │   │   │   ├── users.test.ts
│   │   │   │   ├── organizations.test.ts
│   │   │   │   └── ...
│   ├── app/
│   │   ├── src/
│   │   │   ├── __tests__/    # Component tests (if needed)
```

## Running Tests

Add these scripts to the root `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:backend": "vitest run packages/api/convex/__tests__",
    "test": "bun run test:backend && bun run test:e2e"
  }
}
```

## Test Data Management

For backend tests, we'll use fixtures to set up test data:

```typescript
// packages/api/convex/__tests__/fixtures/testData.ts
export const testUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    clerkId: "user_admin123",
  },
  // ...more test users
];

export const testOrganizations = [
  {
    name: "Test Organization",
    slug: "test-org",
  },
  // ...more test organizations
];
```

For E2E tests, we'll use test hooks to set up and tear down data:

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Set up a logged-in admin user
  adminContext: async ({ page }, use) => {
    // Log in as admin
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
    
    await use(page);
  },
  
  // Set up a logged-in regular user
  userContext: async ({ page }, use) => {
    // Log in as regular user
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
```
