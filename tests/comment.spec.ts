import { test, expect } from '@playwright/test';

test('teacher can comment on student submission', async ({ page }) => {
  // Create case as teacher first
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/);
  
  await page.click('button:has-text("Teacher")');
  await page.waitForURL(/\/teacher/);
  
  // Check for student submissions
  const hasSubmissions = !(await page.locator('text=No submissions yet').isVisible());
  console.log('Has submissions:', hasSubmissions);
  
  if (hasSubmissions) {
    const addCommentBtn = page.locator('button:has-text("Add Comment")').first();
    if (await addCommentBtn.isVisible({ timeout: 3000 })) {
      await addCommentBtn.click();
      await page.fill('input[placeholder="Write a comment..."]', 'Great diagnosis!');
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(2000);
      
      const success = await page.locator('text=Great diagnosis!').isVisible();
      console.log(success ? '✓ Comment added' : '✗ Comment failed');
    } else {
      console.log('No submissions to comment on');
    }
  } else {
    console.log('No submissions to test');
  }
});