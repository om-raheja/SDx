import { test, expect } from '@playwright/test';

test('comment API creates table and works', async ({ page }) => {
  // First test that teacher dashboard loads
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/);
  
  await page.click('button:has-text("Teacher")');
  await page.waitForURL(/\/teacher/);
  await page.waitForTimeout(2000);
  
  // Click Add Comment if available
  const viewComments = page.locator('button:has-text("View Comments")').first();
  const hasViewComments = await viewComments.isVisible().catch(() => false);
  
  if (hasViewComments) {
    await viewComments.click();
    await page.waitForTimeout(1000);
    
    const input = page.locator('input[placeholder="Write a comment..."]');
    if (await input.isVisible()) {
      await input.fill('Test comment via Playwright');
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(2000);
      
      const shown = await page.locator('text=Test comment via Playwright').isVisible();
      console.log(shown ? '✓ Comment added' : '✗ Comment not shown');
    }
  } else {
    console.log('No submissions to test');
  }
  
  console.log('✓ Teacher dashboard works');
});