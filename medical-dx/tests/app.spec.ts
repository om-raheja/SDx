import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('https://medical-dx.vercel.app');
  await expect(page).toHaveTitle(/Medical/i);
  await expect(page.getByText('Medical Diagnosis Practice')).toBeVisible();
});

test('no 404 errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('https://medical-dx.vercel.app');
  await page.waitForLoadState('networkidle');
  
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
  expect(errors.length).toBe(0);
});