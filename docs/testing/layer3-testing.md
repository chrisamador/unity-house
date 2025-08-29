# Layer 3: Dynamic Page System Testing Plan

This document outlines the testing approach for Layer 3 of the Unity House implementation, focusing on the dynamic page creation and rendering system.

## Backend Tests (Convex-test with Vitest)

### Page Model Tests

```typescript
// packages/api/convex/__tests__/pages.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("entity admin can create a page", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a page
  const pageId = await t.mutation(api.pages.create, {
    entityId,
    title: "Test Page",
    slug: "test-page",
    content: {
      type: "document",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello World" }]
        }
      ]
    },
    status: "draft"
  });
  
  // Verify the page was created
  const page = await t.query(api.pages.getById, { id: pageId });
  expect(page).toMatchObject({
    entityId,
    title: "Test Page",
    slug: "test-page",
    status: "draft"
  });
  expect(page.content).toBeDefined();
});

test("entity admin can publish a page", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a draft page
  const pageId = await t.mutation(api.pages.create, {
    entityId,
    title: "Draft Page",
    slug: "draft-page",
    content: {
      type: "document",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Draft Content" }]
        }
      ]
    },
    status: "draft"
  });
  
  // Publish the page
  await t.mutation(api.pages.publish, { pageId });
  
  // Verify the page was published
  const page = await t.query(api.pages.getById, { id: pageId });
  expect(page.status).toBe("published");
  expect(page.publishedAt).toBeDefined();
});

test("entity member cannot publish a page", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a member user
  const memberId = await setupTestMember(t, orgId);
  
  // Create a draft page as admin
  const pageId = await t.mutation(api.pages.create, {
    entityId,
    title: "Member Test Page",
    slug: "member-test-page",
    content: {
      type: "document",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Test Content" }]
        }
      ]
    },
    status: "draft"
  });
  
  // Switch to member user
  t.withAuth({ userId: "member_id" });
  
  // Try to publish the page
  await expect(
    t.mutation(api.pages.publish, { pageId })
  ).rejects.toThrow();
});
```

### Page Template Tests

```typescript
// packages/api/convex/__tests__/pageTemplates.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("entity admin can create a page template", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a page template
  const templateId = await t.mutation(api.pageTemplates.create, {
    entityId,
    name: "Blog Post",
    description: "Template for blog posts",
    content: {
      type: "document",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Blog Post Title" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Blog post content goes here..." }]
        }
      ]
    }
  });
  
  // Verify the template was created
  const template = await t.query(api.pageTemplates.getById, { id: templateId });
  expect(template).toMatchObject({
    entityId,
    name: "Blog Post",
    description: "Template for blog posts"
  });
  expect(template.content).toBeDefined();
});

test("can create a page from a template", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a page template
  const templateId = await t.mutation(api.pageTemplates.create, {
    entityId,
    name: "Landing Page",
    description: "Template for landing pages",
    content: {
      type: "document",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Welcome" }]
        }
      ]
    }
  });
  
  // Create a page from the template
  const pageId = await t.mutation(api.pages.createFromTemplate, {
    entityId,
    title: "New Landing Page",
    slug: "new-landing",
    templateId
  });
  
  // Verify the page was created with template content
  const page = await t.query(api.pages.getById, { id: pageId });
  expect(page).toMatchObject({
    entityId,
    title: "New Landing Page",
    slug: "new-landing",
    status: "draft"
  });
  
  // Check that content was copied from template
  expect(page.content.content[0].content[0].text).toBe("Welcome");
});
```

### Page Component Tests

```typescript
// packages/api/convex/__tests__/pageComponents.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { setupTestOrganization, setupTestEntity } from "./helpers/setupTestData";

test("entity admin can create a custom component", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a custom component
  const componentId = await t.mutation(api.pageComponents.create, {
    entityId,
    name: "Hero Banner",
    description: "A hero banner with image and text",
    schema: {
      type: "object",
      properties: {
        heading: { type: "string" },
        subheading: { type: "string" },
        imageUrl: { type: "string" },
        buttonText: { type: "string" },
        buttonUrl: { type: "string" }
      },
      required: ["heading", "imageUrl"]
    },
    defaultProps: {
      heading: "Welcome to our site",
      subheading: "Learn more about what we do",
      imageUrl: "https://example.com/default-hero.jpg",
      buttonText: "Learn More",
      buttonUrl: "#"
    }
  });
  
  // Verify the component was created
  const component = await t.query(api.pageComponents.getById, { id: componentId });
  expect(component).toMatchObject({
    entityId,
    name: "Hero Banner",
    description: "A hero banner with image and text"
  });
  expect(component.schema).toBeDefined();
  expect(component.defaultProps).toBeDefined();
});

test("can use a custom component in a page", async () => {
  const t = convexTest(schema);
  
  // Set up test organization and entity
  const { adminId, orgId } = await setupTestOrganization(t);
  const entityId = await setupTestEntity(t, orgId);
  
  // Create a custom component
  const componentId = await t.mutation(api.pageComponents.create, {
    entityId,
    name: "Call to Action",
    description: "A call to action button",
    schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        url: { type: "string" }
      },
      required: ["text", "url"]
    },
    defaultProps: {
      text: "Click Here",
      url: "#"
    }
  });
  
  // Create a page with the custom component
  const pageId = await t.mutation(api.pages.create, {
    entityId,
    title: "Page with Component",
    slug: "page-with-component",
    content: {
      type: "document",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Page content" }]
        },
        {
          type: "customComponent",
          attrs: {
            componentId,
            props: {
              text: "Sign Up Now",
              url: "/signup"
            }
          }
        }
      ]
    },
    status: "draft"
  });
  
  // Verify the page was created with the component
  const page = await t.query(api.pages.getById, { id: pageId });
  expect(page.content.content[1].type).toBe("customComponent");
  expect(page.content.content[1].attrs.componentId).toBe(componentId);
  expect(page.content.content[1].attrs.props.text).toBe("Sign Up Now");
});
```

## End-to-End Tests (Playwright)

### Page Creation and Editing Flows

```typescript
// e2e/pageCreation.spec.ts
import { test, expect } from './fixtures';

test.describe('Page Creation', () => {
  test('entity admin can create a page', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to pages section
    await page.click('[data-testid="pages-tab"]');
    
    // Click create page button
    await page.click('[data-testid="create-page-button"]');
    
    // Fill in page details
    const pageTitle = `Test Page ${Date.now()}`;
    await page.fill('[data-testid="page-title-input"]', pageTitle);
    
    // The slug should be auto-generated, but we can check it
    const slugInput = page.locator('[data-testid="page-slug-input"]');
    await expect(slugInput).toHaveValue(pageTitle.toLowerCase().replace(/\s+/g, '-'));
    
    // Add some content to the editor
    await page.click('[data-testid="editor-container"]');
    await page.keyboard.type('This is a test page content.');
    
    // Save as draft
    await page.click('[data-testid="save-draft-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should redirect to page list
    await expect(page).toHaveURL(/\/pages$/);
    
    // Should see new page in list
    await expect(page.getByText(pageTitle)).toBeVisible();
  });
  
  test('entity admin can edit a page', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to pages section
    await page.click('[data-testid="pages-tab"]');
    
    // Click on first page in list
    await page.click('[data-testid="page-row"]');
    
    // Click edit button
    await page.click('[data-testid="edit-page-button"]');
    
    // Update title
    const updatedTitle = `Updated Page ${Date.now()}`;
    await page.fill('[data-testid="page-title-input"]', updatedTitle);
    
    // Update content
    await page.click('[data-testid="editor-container"]');
    await page.keyboard.type(' Additional content added during edit.');
    
    // Save changes
    await page.click('[data-testid="save-changes-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should see updated title
    await expect(page.locator('[data-testid="page-title"]')).toContainText(updatedTitle);
  });
  
  test('entity admin can publish a page', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to pages section
    await page.click('[data-testid="pages-tab"]');
    
    // Find a draft page
    const draftPageRow = page.locator('[data-testid="page-row"]').filter({
      has: page.locator('[data-testid="draft-badge"]')
    }).first();
    
    if (await draftPageRow.isVisible()) {
      // Click on the draft page
      await draftPageRow.click();
      
      // Click publish button
      await page.click('[data-testid="publish-button"]');
      
      // Confirm publish
      await page.click('[data-testid="confirm-publish-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Should see published badge
      await expect(page.locator('[data-testid="published-badge"]')).toBeVisible();
      
      // Should see preview button
      await expect(page.locator('[data-testid="preview-button"]')).toBeVisible();
    }
  });
});
```

### Page Template Flows

```typescript
// e2e/pageTemplates.spec.ts
import { test, expect } from './fixtures';

test.describe('Page Templates', () => {
  test('entity admin can create a page template', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to templates section
    await page.click('[data-testid="templates-tab"]');
    
    // Click create template button
    await page.click('[data-testid="create-template-button"]');
    
    // Fill in template details
    const templateName = `Test Template ${Date.now()}`;
    await page.fill('[data-testid="template-name-input"]', templateName);
    await page.fill('[data-testid="template-description-input"]', 'A test template description');
    
    // Add some content to the editor
    await page.click('[data-testid="editor-container"]');
    await page.keyboard.type('This is a template content.');
    
    // Save template
    await page.click('[data-testid="save-template-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should redirect to template list
    await expect(page).toHaveURL(/\/templates$/);
    
    // Should see new template in list
    await expect(page.getByText(templateName)).toBeVisible();
  });
  
  test('entity admin can create a page from template', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to pages section
    await page.click('[data-testid="pages-tab"]');
    
    // Click create page button
    await page.click('[data-testid="create-page-button"]');
    
    // Select "Create from template" option
    await page.click('[data-testid="create-from-template-option"]');
    
    // Select first template from list
    await page.click('[data-testid="template-option"]');
    
    // Fill in page details
    const pageTitle = `Template-based Page ${Date.now()}`;
    await page.fill('[data-testid="page-title-input"]', pageTitle);
    
    // Should see template content in editor
    await expect(page.locator('[data-testid="editor-container"]')).toContainText('template content');
    
    // Save as draft
    await page.click('[data-testid="save-draft-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should redirect to page list
    await expect(page).toHaveURL(/\/pages$/);
    
    // Should see new page in list
    await expect(page.getByText(pageTitle)).toBeVisible();
  });
});
```

### Page Component Flows

```typescript
// e2e/pageComponents.spec.ts
import { test, expect } from './fixtures';

test.describe('Page Components', () => {
  test('entity admin can create a custom component', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to components section
    await page.click('[data-testid="components-tab"]');
    
    // Click create component button
    await page.click('[data-testid="create-component-button"]');
    
    // Fill in component details
    const componentName = `Test Component ${Date.now()}`;
    await page.fill('[data-testid="component-name-input"]', componentName);
    await page.fill('[data-testid="component-description-input"]', 'A test component description');
    
    // Add a field to the component schema
    await page.click('[data-testid="add-field-button"]');
    await page.fill('[data-testid="field-name-input"]', 'heading');
    await page.selectOption('[data-testid="field-type-select"]', 'string');
    await page.click('[data-testid="required-checkbox"]');
    await page.fill('[data-testid="default-value-input"]', 'Default Heading');
    
    // Save component
    await page.click('[data-testid="save-component-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should redirect to component list
    await expect(page).toHaveURL(/\/components$/);
    
    // Should see new component in list
    await expect(page.getByText(componentName)).toBeVisible();
  });
  
  test('entity admin can add a component to a page', async ({ adminContext: page }) => {
    // Navigate to entity dashboard
    await page.goto('/dashboard');
    await page.click('[data-testid="entities-link"]');
    await page.click('[data-testid="entity-row"]');
    
    // Go to pages section
    await page.click('[data-testid="pages-tab"]');
    
    // Click create page button
    await page.click('[data-testid="create-page-button"]');
    
    // Fill in page details
    const pageTitle = `Component Test Page ${Date.now()}`;
    await page.fill('[data-testid="page-title-input"]', pageTitle);
    
    // Add some content to the editor
    await page.click('[data-testid="editor-container"]');
    await page.keyboard.type('This is a page with a component.');
    
    // Add a component
    await page.click('[data-testid="add-component-button"]');
    
    // Select first component from list
    await page.click('[data-testid="component-option"]');
    
    // Fill in component properties
    await page.fill('[data-testid="component-heading-input"]', 'Custom Heading');
    
    // Insert component
    await page.click('[data-testid="insert-component-button"]');
    
    // Save as draft
    await page.click('[data-testid="save-draft-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should redirect to page list
    await expect(page).toHaveURL(/\/pages$/);
  });
});
```

### Page Rendering Tests

```typescript
// e2e/pageRendering.spec.ts
import { test, expect } from './fixtures';

test.describe('Page Rendering', () => {
  test('published page is publicly accessible', async ({ page }) => {
    // First, as admin, create and publish a page
    await test.step('Create and publish page', async () => {
      // Log in as admin
      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', 'admin@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="sign-in-button"]');
      
      // Navigate to entity
      await page.click('[data-testid="entities-link"]');
      await page.click('[data-testid="entity-row"]');
      
      // Go to pages section
      await page.click('[data-testid="pages-tab"]');
      
      // Create a new page
      await page.click('[data-testid="create-page-button"]');
      const pageTitle = `Public Test Page ${Date.now()}`;
      await page.fill('[data-testid="page-title-input"]', pageTitle);
      await page.click('[data-testid="editor-container"]');
      await page.keyboard.type('This is a public test page.');
      
      // Save and publish
      await page.click('[data-testid="save-and-publish-button"]');
      
      // Get the page slug for later use
      const pageSlug = await page.locator('[data-testid="page-slug"]').textContent();
      
      // Sign out
      await page.click('[data-testid="user-menu-button"]');
      await page.click('[data-testid="sign-out-button"]');
      
      // Store the slug for the next step
      return { pageSlug, pageTitle };
    });
    
    // Then, as an anonymous user, access the page
    const { pageSlug, pageTitle } = await test.step('Create and publish page');
    
    // Visit the public page
    await page.goto(`/${pageSlug}`);
    
    // Should see the page title and content
    await expect(page.locator('h1')).toContainText(pageTitle);
    await expect(page).toContainText('This is a public test page.');
    
    // Should not see edit controls
    await expect(page.locator('[data-testid="edit-page-button"]')).not.toBeVisible();
  });
  
  test('draft page is not publicly accessible', async ({ page }) => {
    // First, as admin, create a draft page
    await test.step('Create draft page', async () => {
      // Log in as admin
      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', 'admin@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="sign-in-button"]');
      
      // Navigate to entity
      await page.click('[data-testid="entities-link"]');
      await page.click('[data-testid="entity-row"]');
      
      // Go to pages section
      await page.click('[data-testid="pages-tab"]');
      
      // Create a new page
      await page.click('[data-testid="create-page-button"]');
      const pageTitle = `Draft Test Page ${Date.now()}`;
      await page.fill('[data-testid="page-title-input"]', pageTitle);
      await page.click('[data-testid="editor-container"]');
      await page.keyboard.type('This is a draft test page.');
      
      // Save as draft
      await page.click('[data-testid="save-draft-button"]');
      
      // Get the page slug for later use
      const pageSlug = await page.locator('[data-testid="page-slug"]').textContent();
      
      // Sign out
      await page.click('[data-testid="user-menu-button"]');
      await page.click('[data-testid="sign-out-button"]');
      
      // Store the slug for the next step
      return { pageSlug };
    });
    
    // Then, as an anonymous user, try to access the draft page
    const { pageSlug } = await test.step('Create draft page');
    
    // Try to visit the draft page
    await page.goto(`/${pageSlug}`);
    
    // Should see 404 page or access denied
    await expect(page).toContainText(/not found|access denied/i);
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

export async function setupTestEntity(t, orgId) {
  const entityId = await t.mutation(api.entities.create, {
    name: "Test Entity",
    slug: "test-entity",
    organizationId: orgId,
    domainURL: "test-entity.example.com"
  });
  
  return entityId;
}

export async function setupTestPage(t, entityId, status = "draft") {
  const pageId = await t.mutation(api.pages.create, {
    entityId,
    title: "Test Page",
    slug: "test-page",
    content: {
      type: "document",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Test content" }]
        }
      ]
    },
    status
  });
  
  if (status === "published") {
    await t.mutation(api.pages.publish, { pageId });
  }
  
  return pageId;
}

export async function setupTestTemplate(t, entityId) {
  const templateId = await t.mutation(api.pageTemplates.create, {
    entityId,
    name: "Test Template",
    description: "A test template",
    content: {
      type: "document",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Template Title" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Template content" }]
        }
      ]
    }
  });
  
  return templateId;
}
```

## Running Tests

To run the tests for Layer 3:

```bash
# Run backend tests
bun run test:backend -- pages.test.ts pageTemplates.test.ts pageComponents.test.ts

# Run E2E tests
bun run test:e2e -- pageCreation.spec.ts pageTemplates.spec.ts pageComponents.spec.ts pageRendering.spec.ts

# Run all Layer 3 tests
bun run test:layer3
```

Add this script to the root `package.json`:

```json
{
  "scripts": {
    "test:layer3": "bun run test:backend -- pages.test.ts pageTemplates.test.ts pageComponents.test.ts && bun run test:e2e -- pageCreation.spec.ts pageTemplates.spec.ts pageComponents.spec.ts pageRendering.spec.ts"
  }
}
```
