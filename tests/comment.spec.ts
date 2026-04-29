import { test, expect } from '@playwright/test';

test('test comment', async ({ page }) => {
  page.on('response', resp => {
    if (resp.url().includes('teacher-comments')) {
      console.log(resp.url(), resp.status(), resp.text());
    }
  });
  
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/);
  
  await page.click('button:has-text("Teacher")');
  await page.waitForTimeout(2000);
  
  // Check if Add Comment exists
  const addBtn = page.locator('button:has-text("Add Comment")');
  const count = await addBtn.count();
  console.log('Add Comment buttons:', count);
  
  if (count > 0) {
    await addBtn.first().click();
    await page.waitForTimeout(500);
    
    // Check for input
    const input = page.locator('input[placeholder="Write a comment..."]');
    if (await input.isVisible()) {
      await input.fill('Test comment');
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(2000);
      
      // Check result
      const result = await page.locator('text=Test comment').isVisible();
      console.log('Result:', result ? 'PASS' : 'FAIL');
    } else {
      console.log('Input not visible after click');
    }
  }
});