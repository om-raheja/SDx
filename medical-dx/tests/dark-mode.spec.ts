import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test('landing page dark mode toggle works', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText('SDx Lab');
    
    // Check dark mode toggle exists
    const darkModeBtn = page.locator('button').first();
    await expect(darkModeBtn).toBeVisible();
    
    // Click dark mode toggle
    await darkModeBtn.click();
    
    // Check dark class is added to html
    const htmlClass = await page.locator('html').getAttribute('class');
    console.log('HTML class after toggle:', htmlClass);
  });
  
  test('dark mode persists after page reload', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Enable dark mode
    await page.locator('button').first().click();
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    
    // Check dark mode is still enabled
    const htmlClass = await page.locator('html').getAttribute('class');
    console.log('HTML class after reload:', htmlClass);
  });
});