import { test, expect } from '@playwright/test';

test('homepage loads with sign in', async ({ page }) => {
  await page.goto('https://medical-dx.vercel.app');
  await expect(page.getByText('Medical Diagnosis Practice')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('homepage has sign up button', async ({ page }) => {
  await page.goto('https://medical-dx.vercel.app');
  await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
});