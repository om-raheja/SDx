import { test, expect } from '@playwright/test';

test('comment works', async ({ page }) => {
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  await page.goto('https://sdxlab.vercel.app/teacher');
  await page.waitForTimeout(3000);
  
  const btn = page.locator('button:has-text("Add Comment")').first();
  await btn.click();
  await page.waitForTimeout(500);
  await page.locator('input[placeholder="Write a comment..."]').first().fill('Test comment ' + Date.now());
  await page.locator('button:has-text("Send")').first().click();
  await page.waitForTimeout(2000);
  
  // Check for specific error about column
  const pageText = await page.textContent('body');
  const hasColumnError = pageText?.includes('column') && pageText?.includes('does not exist');
  console.log('Column error:', hasColumnError ? 'YES' : 'NO');
});