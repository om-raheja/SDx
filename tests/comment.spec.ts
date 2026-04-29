import { test, expect } from '@playwright/test';

test('comment via page reload', async ({ page }) => {
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
  
  // Get submission ID from URL or anywhere on the page
  const subId = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (let b of Array.from(buttons)) {
      if (b.textContent?.includes('Add Comment')) {
        // Try to find parent with submission ID
        let el = b;
        while (el && !el.id) {
          el = el.parentElement;
        }
        return el?.id || 'not-found';
      }
    }
    return 'button-not-found';
  });
  console.log('Submission ID from page:', subId);
  
  // Add comment
  const input = page.locator('input[placeholder="Write a comment..."]').first();
  const testComment = 'Test comment ' + Date.now();
  await input.fill(testComment);
  
  const sendBtn = page.locator('button:has-text("Send")').first();
  await sendBtn.click();
  await page.waitForTimeout(2000);
  
  // Reload page to check
  await page.reload();
  await page.waitForTimeout(3000);
  
  // Check View Comments button
  const viewBtn = page.locator('button:has-text("View Comments")');
  const hasView = await viewBtn.count();
  console.log('View Comments count:', hasView);
  
  if (hasView > 0) {
    await viewBtn.first().click();
    await page.waitForTimeout(1000);
    
    const shown = await page.locator(`text=${testComment}`).isVisible();
    console.log('Comment shown after reload:', shown ? 'YES' : 'NO');
  }
});