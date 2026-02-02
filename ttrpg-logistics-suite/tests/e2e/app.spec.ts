import { test, expect } from '@playwright/test';

test.describe('TTRPG Logistics Suite', () => {
  test('app loads with title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('TTRPG Logistics Suite');
  });
});
