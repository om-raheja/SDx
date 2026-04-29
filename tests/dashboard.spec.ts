import { test, expect } from '@playwright/test';

test('sign in and access dashboard', async ({ page }) => {
  // Listen to console errors
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });

  // Go to sign in page
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  console.log('On sign in page');
  
  // Fill in credentials
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  console.log('Filled credentials');
  
  // Click sign in
  const signInBtn = page.locator('button:has-text("Sign In")');
  await signInBtn.click();
  console.log('Clicked sign in');
  
  // Wait for either dashboard URL or signin with error
  try {
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('URL changed to dashboard');
  } catch {
    // Check if still on signin page - might have error
    const url = page.url();
    console.log('Current URL after sign in:', url);
  }
  
  // Wait for any content
  await page.waitForTimeout(3000);
  
  // Get all text content
  const text = await page.locator('body').textContent();
  console.log('Page text (first 500 chars):', text?.slice(0, 500));
  
  // Check what buttons exist
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons on page:', buttons);
});