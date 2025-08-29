# Layer 2: Basic Entity Management Testing Plan

This document outlines the testing approach for Layer 2 of the Unity House implementation, focusing on basic entity management and user flows.

## Backend Tests (Convex-test with Vitest)

### User Management Tests

```typescript
// packages/api/convex/__tests__/userManagement.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

test("admin can approve a user", async () => {
  const t = convexTest(schema);
  
  // Create admin user
  t.withAuth({ userId: "admin_id" });
  const adminId = await t.mutation(api.users.createUser, { 
    name: "Admin User", 
    email: "admin@example.com",
    clerkId: "admin_id"
  });
  
  // Create a pending user
  const pendingUserId = await t.mutation(api.users.createUser, { 
    name: "Pending User", 
    email: "pending@example.com",
    clerkId: "pending_id"
  });
  
  // Admin approves the user
  await t.mutation(api.users.approveUser, { 
    userId: pendingUserId
  });
  
  // Verify the user was approved
  const approvedUser = await t.query(api.users.getById, { id: pendingUserId });
  expect(approvedUser.approvedBy).toBeTruthy();
});

test("regular user cannot approve another user", async () => {
  const t = convexTest(schema);
  
  // Create regular user
  t.withAuth({ userId: "regular_id" });
  const regularUserId = await t.mutation(api.users.createUser, { 
    name: "Regular User", 
    email: "regular@example.com",
    clerkId: "regular_id"
  });
  
  // Create a pending user
  const pendingUserId = await t.mutation(api.users.createUser, { 
    name: "Pending User", 
    email: "pending@example.com",
    clerkId: "pending_id"
  });
  
  // Regular user tries to approve another user
  await expect(
    t.mutation(api.users.approveUser, { userId: pendingUserId })
  ).rejects.toThrow();
});
```

### Organization Tests

```typescript
// packages/api/convex/__tests__/organizations.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

test("user can create an organization", async () => {
  const t = convexTest(schema);
  
  // Create a user
  t.withAuth({ userId: "user_id" });
  const userId = await t.mutation(api.users.createUser, { 
    name: "Test User", 
    email: "test@example.com",
    clerkId: "user_id"
  });
  
  // Create an organization
  const orgId = await t.mutation(api.organizations.create, {
    name: "Test Organization",
    slug: "test-org"
  });
  
  // Verify the organization was created
  const org = await t.query(api.organizations.getById, { id: orgId });
  expect(org).toMatchObject({
    name: "Test Organization",
    slug: "test-org"
  });
  
  // Verify the user is an admin of the organization
  const members = await t.query(api.organizations.getMembers, { organizationId: orgId });
  expect(members).toHaveLength(1);
  expect(members[0].userId).toBe(userId);
  expect(members[0].role).toBe("admin");
});

test("organization admin can add members", async () => {
  const t = convexTest(schema);
  
  // Create admin user
  t.withAuth({ userId: "admin_id" });
  const adminId = await t.mutation(api.users.createUser, { 
    name: "Admin User", 
    email: "admin@example.com",
    clerkId: "admin_id"
  });
  
  // Create an organization
  const orgId = await t.mutation(api.organizations.create, {
    name: "Test Organization",
    slug: "test-org"
  });
  
  // Create another user
  const memberId = await t.mutation(api.users.createUser, { 
    name: "Member User", 
    email: "member@example.com",
    clerkId: "member_id"
  });
  
  // Add member to organization
  await t.mutation(api.organizations.addMember, {
    organizationId: orgId,
    userId: memberId,
    role: "member"
  });
  
  // Verify the member was added
  const members = await t.query(api.organizations.getMembers, { organizationId: orgId });
  expect(members).toHaveLength(2);
  const memberEntry = members.find(m => m.userId === memberId);
  expect(memberEntry).toBeTruthy();
  expect(memberEntry.role).toBe("member");
});
```

### Entity Tests

```typescript
// packages/api/convex/__tests__/entities.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

test("organization admin can create an entity", async () => {
  const t = convexTest(schema);
  
  // Create admin user
  t.withAuth({ userId: "admin_id" });
  const adminId = await t.mutation(api.users.createUser, { 
    name: "Admin User", 
    email: "admin@example.com",
    clerkId: "admin_id"
  });
  
  // Create an organization
  const orgId = await t.mutation(api.organizations.create, {
    name: "Test Organization",
    slug: "test-org"
  });
  
  // Create an entity
  const entityId = await t.mutation(api.entities.create, {
    name: "Test Entity",
    slug: "test-entity",
    organizationId: orgId,
    domainURL: "test-entity.example.com"
  });
  
  // Verify the entity was created
  const entity = await t.query(api.entities.getById, { id: entityId });
  expect(entity).toMatchObject({
    name: "Test Entity",
    slug: "test-entity",
    organizationId: orgId,
    domainURL: "test-entity.example.com"
  });
});

test("organization member cannot create an entity", async () => {
  const t = convexTest(schema);
  
  // Create admin user and organization
  t.withAuth({ userId: "admin_id" });
  const adminId = await t.mutation(api.users.createUser, { 
    name: "Admin User", 
    email: "admin@example.com",
    clerkId: "admin_id"
  });
  
  const orgId = await t.mutation(api.organizations.create, {
    name: "Test Organization",
    slug: "test-org"
  });
  
  // Create member user
  const memberId = await t.mutation(api.users.createUser, { 
    name: "Member User", 
    email: "member@example.com",
    clerkId: "member_id"
  });
  
  // Add member to organization
  await t.mutation(api.organizations.addMember, {
    organizationId: orgId,
    userId: memberId,
    role: "member"
  });
  
  // Switch to member user
  t.withAuth({ userId: "member_id" });
  
  // Try to create an entity
  await expect(
    t.mutation(api.entities.create, {
      name: "Test Entity",
      slug: "test-entity",
      organizationId: orgId,
      domainURL: "test-entity.example.com"
    })
  ).rejects.toThrow();
});
```

## End-to-End Tests (Playwright)

### User Management Flows

```typescript
// e2e/userManagement.spec.ts
import { test, expect } from './fixtures';

test.describe('User Management', () => {
  test('admin can view and approve users', async ({ adminContext: page }) => {
    // Navigate to users page
    await page.click('[data-testid="admin-menu"]');
    await page.click('[data-testid="users-link"]');
    
    // Should see user list
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    
    // Find a pending user
    const pendingUserRow = page.locator('[data-testid="user-row"]').filter({
      has: page.locator('[data-testid="pending-badge"]')
    }).first();
    
    if (await pendingUserRow.isVisible()) {
      // Get user name for verification
      const userName = await pendingUserRow.locator('[data-testid="user-name"]').textContent();
      
      // Click approve button
      await pendingUserRow.locator('[data-testid="approve-button"]').click();
      
      // Confirm approval
      await page.click('[data-testid="confirm-approve-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // User should no longer have pending badge
      await expect(
        page.locator('[data-testid="user-row"]')
          .filter({ hasText: userName })
          .locator('[data-testid="pending-badge"]')
      ).not.toBeVisible();
    }
  });
  
  test('regular user cannot access user management', async ({ userContext: page }) => {
    // Try to navigate to users page
    await page.goto('/admin/users');
    
    // Should be redirected or shown access denied
    await expect(page).not.toHaveURL('/admin/users');
    
    // Should not see admin menu
    await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
  });
});
```

### Organization Management Flows

```typescript
// e2e/organizationManagement.spec.ts
import { test, expect } from './fixtures';

test.describe('Organization Management', () => {
  test('user can create an organization', async ({ userContext: page }) => {
    // Navigate to organizations page
    await page.click('[data-testid="organizations-link"]');
    
    // Click create button
    await page.click('[data-testid="create-organization-button"]');
    
    // Fill in organization details
    const orgName = `Test Org ${Date.now()}`;
    await page.fill('[data-testid="organization-name-input"]', orgName);
    await page.fill('[data-testid="organization-slug-input"]', orgName.toLowerCase().replace(/\s+/g, '-'));
    
    // Submit form
    await page.click('[data-testid="save-organization-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should see new organization in list
    await expect(page.getByText(orgName)).toBeVisible();
  });
  
  test('organization admin can add members', async ({ adminContext: page }) => {
    // Navigate to organizations page
    await page.click('[data-testid="organizations-link"]');
    
    // Select first organization
    await page.click('[data-testid="organization-row"]');
    
    // Go to members tab
    await page.click('[data-testid="members-tab"]');
    
    // Click add member button
    await page.click('[data-testid="add-member-button"]');
    
    // Fill in member details
    await page.fill('[data-testid="member-email-input"]', 'newmember@example.com');
    await page.selectOption('[data-testid="member-role-select"]', 'member');
    
    // Submit form
    await page.click('[data-testid="add-member-submit"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should see new member in list
    await expect(page.getByText('newmember@example.com')).toBeVisible();
  });
});
```

### Entity Management Flows

```typescript
// e2e/entityManagement.spec.ts
import { test, expect } from './fixtures';

test.describe('Entity Management', () => {
  test('organization admin can create an entity', async ({ adminContext: page }) => {
    // Navigate to organizations page
    await page.click('[data-testid="organizations-link"]');
    
    // Select first organization
    await page.click('[data-testid="organization-row"]');
    
    // Go to entities tab
    await page.click('[data-testid="entities-tab"]');
    
    // Click create entity button
    await page.click('[data-testid="create-entity-button"]');
    
    // Fill in entity details
    const entityName = `Test Entity ${Date.now()}`;
    await page.fill('[data-testid="entity-name-input"]', entityName);
    await page.fill('[data-testid="entity-slug-input"]', entityName.toLowerCase().replace(/\s+/g, '-'));
    await page.fill('[data-testid="entity-domain-input"]', `${entityName.toLowerCase().replace(/\s+/g, '-')}.example.com`);
    
    // Submit form
    await page.click('[data-testid="save-entity-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should see new entity in list
    await expect(page.getByText(entityName)).toBeVisible();
  });
  
  test('organization admin can update entity domain', async ({ adminContext: page }) => {
    // Navigate to organizations page
    await page.click('[data-testid="organizations-link"]');
    
    // Select first organization
    await page.click('[data-testid="organization-row"]');
    
    // Go to entities tab
    await page.click('[data-testid="entities-tab"]');
    
    // Select first entity
    await page.click('[data-testid="entity-row"]');
    
    // Click edit button
    await page.click('[data-testid="edit-entity-button"]');
    
    // Update domain
    const newDomain = `updated-${Date.now()}.example.com`;
    await page.fill('[data-testid="entity-domain-input"]', newDomain);
    
    // Submit form
    await page.click('[data-testid="save-entity-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should see updated domain
    await expect(page.getByText(newDomain)).toBeVisible();
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

export async function setupTestOrganization(t) {
  // Create admin user
  t.withAuth({ userId: "admin_id" });
  const adminId = await t.mutation(api.users.createUser, { 
    name: "Admin User", 
    email: "admin@example.com",
    clerkId: "admin_id"
  });
  
  // Create an organization
  const orgId = await t.mutation(api.organizations.create, {
    name: "Test Organization",
    slug: "test-org"
  });
  
  return { adminId, orgId };
}

export async function setupTestMember(t, orgId) {
  // Create member user
  const memberId = await t.mutation(api.users.createUser, { 
    name: "Member User", 
    email: "member@example.com",
    clerkId: "member_id"
  });
  
  // Add member to organization
  await t.mutation(api.organizations.addMember, {
    organizationId: orgId,
    userId: memberId,
    role: "member"
  });
  
  return memberId;
}
```

## Running Tests

To run the tests for Layer 2:

```bash
# Run backend tests
bun run test:backend -- organizations.test.ts entities.test.ts userManagement.test.ts

# Run E2E tests
bun run test:e2e -- userManagement.spec.ts organizationManagement.spec.ts entityManagement.spec.ts

# Run all Layer 2 tests
bun run test:layer2
```

Add this script to the root `package.json`:

```json
{
  "scripts": {
    "test:layer2": "bun run test:backend -- organizations.test.ts entities.test.ts userManagement.test.ts && bun run test:e2e -- userManagement.spec.ts organizationManagement.spec.ts entityManagement.spec.ts"
  }
}
```
