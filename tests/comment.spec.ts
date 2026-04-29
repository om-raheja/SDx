import { test, expect } from '@playwright/test';

test('comment shows teacher name', async ({ page }) => {
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
    await page.locator('input[placeholder="Write a comment..."]').first().fill('Test with name');
    await page.locator('button:has-text("Send")').first().click();
    await page.waitForTimeout(2000);
    
    const teacherName = await page.locator('text=Teacher:').isVisible();
    console.log('Teacher name shown:', teacherName ? 'YES' : 'NO');
    expect(teacherName).toBe(true);
  }
});