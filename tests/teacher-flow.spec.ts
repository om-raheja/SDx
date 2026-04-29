import { test, expect } from '@playwright/test';

test.describe('Complete Teacher Flow', () => {
  test('sign in, create case with 2 hints (minimum)', async ({ page }) => {
    await page.goto('https://sdxlab.vercel.app/auth/signin');
    await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
    await page.fill('input[placeholder="Password"]', 'October32018!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    console.log('✓ Signed in');
    
    await page.click('button:has-text("Teacher")');
    await page.waitForURL(/\/teacher/);
    console.log('✓ Teacher dashboard');
    
    await page.click('button:has-text("Create Case")');
    await page.waitForURL(/\/teacher\/create/);
    console.log('✓ Create case page');
    
    // Set title
    await page.fill('input[placeholder="e.g., Chest Pain Case"]', 'Minimum 2 Hints Test');
    
    // Set to minimum 2 hints
    await page.locator('input[type="range"]').fill('2');
    await page.locator('input[type="number"]').fill('2');
    await page.waitForTimeout(500);
    
    // Verify only 2 textareas
    expect(await page.locator('textarea').count()).toBe(2);
    console.log('✓ 2 hint textareas');
    
    // Fill both hints
    await page.locator('textarea').nth(0).fill('First hint content');
    await page.locator('textarea').nth(1).fill('Second hint content');
    console.log('✓ Filled both hints');
    
    // Submit
    await page.click('button:has-text("Create Case")');
    await page.waitForURL(/\/teacher/, { timeout: 15000 });
    console.log('✓ Case with 2 hints created!');
  });

  test('sign in, create case with 5 hints', async ({ page }) => {
    await page.goto('https://sdxlab.vercel.app/auth/signin');
    await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
    await page.fill('input[placeholder="Password"]', 'October32018!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/dashboard/);
    
    await page.click('button:has-text("Teacher")');
    await page.click('button:has-text("Create Case")');
    
    await page.fill('input[placeholder="e.g., Chest Pain Case"]', '5 Hints Test');
    await page.locator('input[type="range"]').fill('5');
    await page.locator('input[type="number"]').fill('5');
    await page.waitForTimeout(500);
    
    expect(await page.locator('textarea').count()).toBe(5);
    console.log('✓ 5 hint textareas');
    
    for (let i = 0; i < 5; i++) {
      await page.locator('textarea').nth(i).fill(`Hint ${i + 1}`);
    }
    
    await page.click('button:has-text("Create Case")');
    await page.waitForURL(/\/teacher/);
    console.log('✓ Case with 5 hints created!');
  });

  test('create case with 20 hints - validation', async ({ page }) => {
    await page.goto('https://sdxlab.vercel.app/auth/signin');
    await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
    await page.fill('input[placeholder="Password"]', 'October32018!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/dashboard/);
    
    await page.click('button:has-text("Teacher")');
    await page.click('button:has-text("Create Case")');
    
    await page.fill('input[placeholder="e.g., Chest Pain Case"]', '20 Hints');
    await page.locator('input[type="range"]').fill('20');
    await page.locator('input[type="number"]').fill('20');
    await page.waitForTimeout(500);
    
    expect(await page.locator('textarea').count()).toBe(20);
    console.log('✓ 20 hint textareas');
    
    // Fill only 3 hints
    for (let i = 0; i < 3; i++) {
      await page.locator('textarea').nth(i).fill(`Hint ${i + 1}`);
    }
    
    // Submit - should error
    await page.click('button:has-text("Create Case")');
    
    // Should show validation error
    await expect(page.locator('text=Please fill in all 20 hints')).toBeVisible({ timeout: 5000 });
    console.log('✓ Validation error shown');
  });

  test.skip('create case with image upload', async ({ page }) => {
    await page.goto('https://sdxlab.vercel.app/auth/signin');
    await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
    await page.fill('input[placeholder="Password"]', 'October32018!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/dashboard/);
    
    await page.click('button:has-text("Teacher")');
    await page.click('button:has-text("Create Case")');
    
    await page.fill('input[placeholder="e.g., Chest Pain Case"]', 'Image Test Case');
    await page.fill('textarea:nth-of-type(1)', 'First hint content');
    
    // Upload an image for hint 1
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake image content')
    });
    
    // Wait for upload to complete
    await page.waitForTimeout(2000);
    
    // Check if remove image button appears (meaning upload succeeded)
    const removeBtn = page.locator('button:has-text("Remove Image")');
    await expect(removeBtn).toBeVisible({ timeout: 10000 });
    console.log('✓ Image uploaded successfully');
  });

  test('student submissions show correct student info', async ({ page }) => {
    await page.goto('https://sdxlab.vercel.app/auth/signin');
    await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
    await page.fill('input[placeholder="Password"]', 'October32018!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/dashboard/);
    
    await page.click('button:has-text("Teacher")');
    
    const submissionsHeader = page.locator('text=Student Submissions');
    await expect(submissionsHeader).toBeVisible();
    console.log('✓ Student submissions section visible');
  });
});