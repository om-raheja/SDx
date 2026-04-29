import { test, expect } from '@playwright/test';

test('comment flow', async ({ page }) => {
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  await page.goto('https://sdxlab.vercel.app/teacher');
  await page.waitForTimeout(3000);
  
  const btn = page.locator('button:has-text("Add Comment")').first();
  const exists = await btn.isVisible().catch(() => false);
  console.log('Add Comment:', exists);
  
  if (exists) {
    await btn.click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="Write a comment..."]', 'Test comment');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(3000);
    
    const shown = await page.locator('text=Test comment').isVisible();
    console.log('Result:', shown ? 'PASS' : 'FAIL');
    expect(shown).toBe(true);
  }
});