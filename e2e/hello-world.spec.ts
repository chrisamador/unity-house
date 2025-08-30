import { test, expect } from '@playwright/test';

test('Hello World page loads correctly', async ({ page }) => {
  // Visit the home page
  await page.goto('/');
  
  // Verify the page contains the Hello World text
  await expect(page.getByText('Hello World')).toBeVisible();
});
