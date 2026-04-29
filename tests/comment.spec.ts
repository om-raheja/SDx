import { test, expect } from '@playwright/test';

test('comment flow', async ({ page }) => {
  // Sign in
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  // Go to teacher
  await page.goto('https://sdxlab.vercel.app/teacher');
  await page.waitForTimeout(3000);
  
  // Find Add Comment
  const btn = page.locator('button:has-text("Add Comment")').first();
  const exists = await btn.isVisible().catch(() => false);
  console.log('Add Comment visible:', exists);
  
  if (exists) {
    await btn.click();
    await page.waitForTimeout(1000);
    
    const input = page.locator('input[placeholder="Write a comment..."]');
    await input.fill('Test comment');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(3000);
    
    const shown = await page.locator('text=Test comment').isVisible();
    console.log('Comment shown:', shown);
    
    if (!shown) {
      const error = page.locator('.text-red-500, .text-red-600');
      const errTxt = await error.textContent().catch(() => 'no error');
      console.log('Error:', errTxt);
    }
  } else {
    console.log('No submissions');
  }
});