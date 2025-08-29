# Layer 4: Domain Resolution and Multi-tenancy Testing Plan

This document outlines the testing approach for Layer 4 of the Unity House implementation, focusing on domain resolution, multi-tenancy, theming, and white-labeling.

## Backend Tests (Convex-test with Vitest)

### Domain Resolution Tests

```typescript
// packages/api/convex/__tests__/domains.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("can resolve entity by custom domain", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId, {
    customDomain: "test-custom-domain.com"
  });
  
  // Resolve entity by domain
  const entity = await t.query(api.domains.resolveEntityByDomain, {
    domain: "test-custom-domain.com"
  });
  
  // Verify correct entity is resolved
  expect(entity._id).toBe(entityId);
});

test("can resolve entity by subdomain", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId, {
    slug: "test-entity"
  });
  
  // Resolve entity by subdomain
  const entity = await t.query(api.domains.resolveEntityByDomain, {
    domain: "test-entity.unityhouse.app"
  });
  
  // Verify correct entity is resolved
  expect(entity._id).toBe(entityId);
});

test("domain verification process works", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Request domain verification
  const verificationToken = await t.mutation(api.domains.requestVerification, {
    entityId,
    domain: "new-domain.com"
  });
  
  // Verify token was generated
  expect(verificationToken).toBeDefined();
  
  // Simulate verification success
  await t.mutation(api.domains.completeVerification, {
    entityId,
    domain: "new-domain.com",
    verificationToken
  });
  
  // Check domain is now verified
  const entity = await t.query(api.entities.getById, { id: entityId });
  expect(entity.verifiedDomains).toContain("new-domain.com");
});
```

### Multi-tenancy Tests

```typescript
// packages/api/convex/__tests__/multiTenancy.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("entity data is isolated between tenants", async () => {
  const t = convexTest(schema);
  
  // Set up two separate organizations and entities
  const { adminId: admin1Id, orgId: org1Id } = await setupTestOrganization(t, {
    name: "Org 1"
  });
  const entity1Id = await setupTestEntity(t, org1Id, {
    name: "Entity 1"
  });
  
  const { adminId: admin2Id, orgId: org2Id } = await setupTestOrganization(t, {
    name: "Org 2"
  });
  const entity2Id = await setupTestEntity(t, org2Id, {
    name: "Entity 2"
  });
  
  // Create a page for entity 1
  const page1Id = await t.mutation(api.pages.create, {
    entityId: entity1Id,
    title: "Entity 1 Page",
    slug: "entity-1-page",
    content: { type: "document", content: [] },
    status: "published"
  });
  
  // Switch to admin 2 and try to access entity 1's page
  t.withAuth({ userId: admin2Id });
  
  // Should not be able to access entity 1's page
  await expect(
    t.query(api.pages.getById, { id: page1Id })
  ).rejects.toThrow();
  
  // Should be able to access own entity's data
  const entity2 = await t.query(api.entities.getById, { id: entity2Id });
  expect(entity2.name).toBe("Entity 2");
});

test("shared resources are accessible across tenants", async () => {
  const t = convexTest(schema);
  
  // Set up a global resource (e.g., a system-wide template)
  const globalTemplateId = await t.mutation(api.system.createGlobalTemplate, {
    name: "Global Template",
    content: { type: "document", content: [] }
  });
  
  // Set up two separate organizations and entities
  const { adminId: admin1Id, orgId: org1Id } = await setupTestOrganization(t);
  const entity1Id = await setupTestEntity(t, org1Id);
  
  const { adminId: admin2Id, orgId: org2Id } = await setupTestOrganization(t);
  const entity2Id = await setupTestEntity(t, org2Id);
  
  // Admin 1 should be able to access global template
  t.withAuth({ userId: admin1Id });
  const template1 = await t.query(api.system.getGlobalTemplate, { id: globalTemplateId });
  expect(template1.name).toBe("Global Template");
  
  // Admin 2 should also be able to access global template
  t.withAuth({ userId: admin2Id });
  const template2 = await t.query(api.system.getGlobalTemplate, { id: globalTemplateId });
  expect(template2.name).toBe("Global Template");
});
```

### Theming Tests

```typescript
// packages/api/convex/__tests__/themes.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("entity admin can create and apply a theme", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a theme
  const themeId = await t.mutation(api.themes.create, {
    entityId,
    name: "Blue Theme",
    colors: {
      primary: "#0066cc",
      secondary: "#003366",
      accent: "#66ccff",
      background: "#ffffff",
      text: "#333333"
    },
    fonts: {
      heading: "Montserrat",
      body: "Open Sans"
    },
    logoUrl: "https://example.com/logo.png"
  });
  
  // Apply theme to entity
  await t.mutation(api.entities.updateTheme, {
    entityId,
    themeId
  });
  
  // Verify theme was applied
  const entity = await t.query(api.entities.getById, { id: entityId });
  expect(entity.themeId).toBe(themeId);
  
  // Get resolved entity with theme
  const resolvedEntity = await t.query(api.entities.getWithTheme, { id: entityId });
  expect(resolvedEntity.theme.colors.primary).toBe("#0066cc");
});

test("entity can have multiple themes but only one active", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create two themes
  const theme1Id = await t.mutation(api.themes.create, {
    entityId,
    name: "Light Theme",
    colors: {
      primary: "#0066cc",
      background: "#ffffff"
    }
  });
  
  const theme2Id = await t.mutation(api.themes.create, {
    entityId,
    name: "Dark Theme",
    colors: {
      primary: "#66ccff",
      background: "#333333"
    }
  });
  
  // Apply first theme
  await t.mutation(api.entities.updateTheme, {
    entityId,
    themeId: theme1Id
  });
  
  // Verify first theme is active
  let entity = await t.query(api.entities.getById, { id: entityId });
  expect(entity.themeId).toBe(theme1Id);
  
  // Apply second theme
  await t.mutation(api.entities.updateTheme, {
    entityId,
    themeId: theme2Id
  });
  
  // Verify second theme is now active
  entity = await t.query(api.entities.getById, { id: entityId });
  expect(entity.themeId).toBe(theme2Id);
  
  // Get all themes for entity
  const themes = await t.query(api.themes.listByEntity, { entityId });
  expect(themes.length).toBe(2);
});
```

### White-labeling Tests

```typescript
// packages/api/convex/__tests__/whiteLabelingTest.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("entity can configure white-label settings", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Configure white-label settings
  await t.mutation(api.entities.updateWhiteLabel, {
    entityId,
    whiteLabel: {
      enabled: true,
      productName: "Custom Product",
      companyName: "Custom Company",
      supportEmail: "support@customcompany.com",
      hidePoweredBy: true,
      favicon: "https://example.com/favicon.ico",
      metaTags: {
        title: "Custom Product - Your Solution",
        description: "A custom solution for your needs"
      }
    }
  });
  
  // Verify white-label settings were applied
  const entity = await t.query(api.entities.getById, { id: entityId });
  expect(entity.whiteLabel.enabled).toBe(true);
  expect(entity.whiteLabel.productName).toBe("Custom Product");
  expect(entity.whiteLabel.hidePoweredBy).toBe(true);
});

test("white-label settings affect public site metadata", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity with white-label
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId, {
    customDomain: "branded-site.com",
    whiteLabel: {
      enabled: true,
      productName: "Branded Product",
      metaTags: {
        title: "Branded Product - Custom Solution",
        description: "A fully branded solution"
      }
    }
  });
  
  // Get public site metadata
  const metadata = await t.query(api.public.getSiteMetadata, {
    domain: "branded-site.com"
  });
  
  // Verify metadata reflects white-label settings
  expect(metadata.title).toBe("Branded Product - Custom Solution");
  expect(metadata.description).toBe("A fully branded solution");
  expect(metadata.poweredBy).toBeUndefined();
});
```

## End-to-End Tests (Playwright)

### Domain Management Flows

```typescript
// e2e/domainManagement.spec.ts
import { test, expect } from './fixtures';

test.describe('Domain Management', () => {
  test('entity admin can add a custom domain', async ({ adminContext: page }) => {
    // Navigate to entity settings
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="domains-settings"]');
    
    // Add new domain
    await page.click('[data-testid="add-domain-button"]');
    const testDomain = `test-domain-${Date.now()}.com`;
    await page.fill('[data-testid="domain-input"]', testDomain);
    await page.click('[data-testid="save-domain-button"]');
    
    // Should show verification instructions
    await expect(page.locator('[data-testid="verification-instructions"]')).toBeVisible();
    
    // Should see domain in pending list
    await expect(page.locator('[data-testid="pending-domains-list"]')).toContainText(testDomain);
  });
  
  test('entity admin can see domain verification status', async ({ adminContext: page }) => {
    // Navigate to entity settings
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="domains-settings"]');
    
    // Check if there are pending domains
    const pendingDomains = page.locator('[data-testid="pending-domains-list"] [data-testid="domain-row"]');
    
    if (await pendingDomains.count() > 0) {
      // Check verification status
      await expect(page.locator('[data-testid="verification-status"]').first()).toBeVisible();
      
      // Should have verify button
      await expect(page.locator('[data-testid="check-verification-button"]').first()).toBeVisible();
    }
    
    // Check if there are verified domains
    const verifiedDomains = page.locator('[data-testid="verified-domains-list"] [data-testid="domain-row"]');
    
    if (await verifiedDomains.count() > 0) {
      // Should show verified status
      await expect(page.locator('[data-testid="verified-badge"]').first()).toBeVisible();
    }
  });
});
```

### Theme Management Flows

```typescript
// e2e/themeManagement.spec.ts
import { test, expect } from './fixtures';

test.describe('Theme Management', () => {
  test('entity admin can create a custom theme', async ({ adminContext: page }) => {
    // Navigate to entity settings
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="appearance-settings"]');
    
    // Create new theme
    await page.click('[data-testid="create-theme-button"]');
    
    // Fill theme details
    const themeName = `Test Theme ${Date.now()}`;
    await page.fill('[data-testid="theme-name-input"]', themeName);
    
    // Set primary color
    await page.click('[data-testid="primary-color-picker"]');
    await page.fill('[data-testid="color-hex-input"]', '#3366cc');
    await page.click('[data-testid="apply-color-button"]');
    
    // Set secondary color
    await page.click('[data-testid="secondary-color-picker"]');
    await page.fill('[data-testid="color-hex-input"]', '#6699ff');
    await page.click('[data-testid="apply-color-button"]');
    
    // Save theme
    await page.click('[data-testid="save-theme-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should see theme in list
    await expect(page.locator('[data-testid="themes-list"]')).toContainText(themeName);
  });
  
  test('entity admin can apply a theme', async ({ adminContext: page }) => {
    // Navigate to entity settings
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="appearance-settings"]');
    
    // Select first theme in list
    await page.click('[data-testid="theme-row"]');
    
    // Apply theme
    await page.click('[data-testid="apply-theme-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should show active badge on theme
    await expect(page.locator('[data-testid="active-theme-badge"]')).toBeVisible();
    
    // Check theme preview
    await expect(page.locator('[data-testid="theme-preview"]')).toBeVisible();
  });
});
```

### White-labeling Flows

```typescript
// e2e/whiteLabelingSettings.spec.ts
import { test, expect } from './fixtures';

test.describe('White-labeling Settings', () => {
  test('entity admin can configure white-labeling', async ({ adminContext: page }) => {
    // Navigate to entity settings
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="white-label-settings"]');
    
    // Enable white-labeling
    await page.click('[data-testid="enable-white-label-toggle"]');
    
    // Fill white-label details
    const productName = `Custom Product ${Date.now()}`;
    await page.fill('[data-testid="product-name-input"]', productName);
    await page.fill('[data-testid="company-name-input"]', 'Custom Company');
    await page.fill('[data-testid="support-email-input"]', 'support@customcompany.com');
    
    // Hide powered by
    await page.click('[data-testid="hide-powered-by-toggle"]');
    
    // Fill meta tags
    await page.fill('[data-testid="meta-title-input"]', 'Custom Product - Your Solution');
    await page.fill('[data-testid="meta-description-input"]', 'A custom solution for your needs');
    
    // Save settings
    await page.click('[data-testid="save-white-label-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
  
  test('white-labeling affects public site', async ({ page }) => {
    // First, as admin, configure white-labeling and get domain
    const domain = await test.step('Configure white-labeling', async () => {
      // Log in as admin
      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', 'admin@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="sign-in-button"]');
      
      // Navigate to entity
      await page.click('[data-testid="entities-link"]');
      await page.click('[data-testid="entity-row"]');
      
      // Get entity domain/slug
      const entityDomain = await page.locator('[data-testid="entity-domain"]').textContent();
      
      // Configure white-labeling
      await page.click('[data-testid="settings-tab"]');
      await page.click('[data-testid="white-label-settings"]');
      await page.click('[data-testid="enable-white-label-toggle"]');
      await page.fill('[data-testid="product-name-input"]', 'White Label Product');
      await page.click('[data-testid="hide-powered-by-toggle"]');
      await page.click('[data-testid="save-white-label-button"]');
      
      // Sign out
      await page.click('[data-testid="user-menu-button"]');
      await page.click('[data-testid="sign-out-button"]');
      
      return entityDomain;
    });
    
    // Then, as anonymous user, visit the site
    await page.goto(`https://${domain}`);
    
    // Should see custom product name
    await expect(page.locator('title')).toContainText('White Label Product');
    
    // Should not see "Powered by Unity House"
    await expect(page.locator('footer')).not.toContainText('Powered by Unity House');
  });
});
```

### Multi-tenant Isolation Tests

```typescript
// e2e/multiTenantIsolation.spec.ts
import { test, expect } from './fixtures';

test.describe('Multi-tenant Isolation', () => {
  test('users cannot access other tenants data', async ({ page }) => {
    // Log in as admin for first entity
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'admin1@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    
    // Navigate to entity and create a page
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="pages-tab"]');
    await page.click('[data-testid="create-page-button"]');
    
    const pageTitle = `Tenant 1 Page ${Date.now()}`;
    await page.fill('[data-testid="page-title-input"]', pageTitle);
    await page.click('[data-testid="editor-container"]');
    await page.keyboard.type('This is tenant 1 content.');
    await page.click('[data-testid="save-and-publish-button"]');
    
    // Get the page URL
    const pageUrl = await page.url();
    
    // Sign out
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="sign-out-button"]');
    
    // Log in as admin for second entity
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'admin2@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    
    // Try to access first entity's page
    await page.goto(pageUrl);
    
    // Should see access denied or not found
    await expect(page).toContainText(/access denied|not found/i);
  });
  
  test('each tenant has isolated themes', async ({ page }) => {
    // Log in as admin for first entity
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'admin1@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    
    // Navigate to entity and create a theme
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="appearance-settings"]');
    
    // Create theme
    await page.click('[data-testid="create-theme-button"]');
    const themeName = `Tenant 1 Theme ${Date.now()}`;
    await page.fill('[data-testid="theme-name-input"]', themeName);
    await page.click('[data-testid="save-theme-button"]');
    
    // Sign out
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="sign-out-button"]');
    
    // Log in as admin for second entity
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'admin2@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    
    // Navigate to entity themes
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="appearance-settings"]');
    
    // Should not see first tenant's theme
    await expect(page.locator('[data-testid="themes-list"]')).not.toContainText(themeName);
  });
});
```

## Test Data Setup

For backend tests, we'll extend our helper to set up test data:

```typescript
// packages/api/convex/__tests__/helpers/setupTestData.ts
import { convexTest } from "convex-test";
import { api } from "../../_generated/api";
import schema from "../../schema";

// ... existing setup functions ...

export async function setupTestEntity(t, orgId, options = {}) {
  const entityId = await t.mutation(api.entities.create, {
    name: options.name || "Test Entity",
    slug: options.slug || `test-entity-${Date.now()}`,
    organizationId: orgId,
    customDomain: options.customDomain,
    whiteLabel: options.whiteLabel
  });
  
  return entityId;
}

export async function setupTestTheme(t, entityId) {
  const themeId = await t.mutation(api.themes.create, {
    entityId,
    name: "Test Theme",
    colors: {
      primary: "#0066cc",
      secondary: "#003366",
      accent: "#66ccff",
      background: "#ffffff",
      text: "#333333"
    },
    fonts: {
      heading: "Montserrat",
      body: "Open Sans"
    }
  });
  
  return themeId;
}
```

## Running Tests

To run the tests for Layer 4:

```bash
# Run backend tests
bun run test:backend -- domains.test.ts multiTenancy.test.ts themes.test.ts whiteLabelingTest.ts

# Run E2E tests
bun run test:e2e -- domainManagement.spec.ts themeManagement.spec.ts whiteLabelingSettings.spec.ts multiTenantIsolation.spec.ts

# Run all Layer 4 tests
bun run test:layer4
```

Add this script to the root `package.json`:

```json
{
  "scripts": {
    "test:layer4": "bun run test:backend -- domains.test.ts multiTenancy.test.ts themes.test.ts whiteLabelingTest.ts && bun run test:e2e -- domainManagement.spec.ts themeManagement.spec.ts whiteLabelingSettings.spec.ts multiTenantIsolation.spec.ts"
  }
}
```
