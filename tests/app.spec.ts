import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Medical/i);
});

test('signin page loads', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page.getByRole('heading', { name: 'SDx Lab' })).toBeVisible();
});

test('dark mode toggle works', async ({ page }) => {
  await page.goto('/auth/signin');
  const btn = page.locator('button').first();
  await btn.click();
  await page.waitForTimeout(300);
  const htmlClass = await page.locator('html').getAttribute('class');
  expect(htmlClass).toContain('dark');
});