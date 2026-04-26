import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test('landing page dark mode toggle works', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText('SDx Lab');
    
    // Get initial main element background
    const initialBg = await page.locator('.flex.flex-col').first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    console.log('Initial background:', initialBg);
    
    // Click dark mode toggle
    const darkModeBtn = page.locator('button').first();
    await darkModeBtn.click();
    await page.waitForTimeout(500);
    
    // Check dark class
    const htmlClass = await page.locator('html').getAttribute('class');
    console.log('HTML class after toggle:', htmlClass);
    
    // Get background after toggle
    const darkBg = await page.locator('.flex.flex-col').first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    console.log('Dark background:', darkBg);
  });
});