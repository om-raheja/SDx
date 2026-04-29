import { test, expect } from '@playwright/test';

test('comment works', async ({ page }) => {
  page.on('response', r => {
    if (r.url().includes('teacher-comments')) {
      console.log(r.url(), r.status());
    }
  });
  
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  await page.goto('https://sdxlab.vercel.app/teacher');
  await page.waitForTimeout(3000);
  
  const btn = page.locator('button:has-text("Add Comment")').first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Write a comment..."]').first().fill('Test comment');
    await page.locator('button:has-text("Send")').first().click();
    await page.waitForTimeout(3000);
    
    const shown = await page.locator('text=Test comment').isVisible();
    console.log('Result:', shown ? 'PASS' : 'FAIL');
  }
});