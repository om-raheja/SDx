import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('https://medical-dx.vercel.app');
  await expect(page.getByText('Medical Diagnosis Practice')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('dashboard accessible', async ({ page }) => {
  await page.goto('https://medical-dx.vercel.app/dashboard');
  await expect(page.getByText('Medical Diagnosis Cases')).toBeVisible();
});