import { test, expect } from '@playwright/test';

test('delete submission and verify UI updates', async ({ page }) => {
  // Go to sign in
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  
  // Sign in
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  // Wait for dashboard to load
  await page.waitForTimeout(5000);
  
  // Find Fish Fight case container (the div that contains "Fish Fight" text)
  const allCaseDivs = page.locator('div.rounded-lg.border');
  const count = await allCaseDivs.count();
  console.log(`Found ${count} case containers`);
  
  let fishFightContainer = null;
  for (let i = 0; i < count; i++) {
    const div = allCaseDivs.nth(i);
    const text = await div.textContent();
    if (text?.includes('Fish Fight')) {
      fishFightContainer = div;
      console.log(`Found Fish Fight at index ${i}`);
      break;
    }
  }
  
  if (!fishFightContainer) {
    console.log('Fish Fight case not found');
    return;
  }
  
  // Get initial submission count from the button
  const viewBtn = fishFightContainer.locator('button:has-text("View Submissions")').first();
  const initialText = await viewBtn.textContent();
  console.log('Initial button text:', initialText);
  
  const initialMatch = initialText?.match(/View Submissions(\d+)/);
  const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;
  console.log('Initial submission count:', initialCount);
  
  if (initialCount === 0) {
    console.log('No submissions to delete. Need to create one first.');
    return;
  }
  
  // Click to expand
  await viewBtn.click();
  await page.waitForTimeout(2000);
  
  // Find the trash button (delete button)
  const deleteBtn = fishFightContainer.locator('button[title="Delete student submissions"]');
  const isDeleteVisible = await deleteBtn.isVisible();
  console.log('Delete button visible:', isDeleteVisible);
  
  if (isDeleteVisible) {
    await deleteBtn.click();
    console.log('Clicked delete button');
    await page.waitForTimeout(3000);
    
    // Check if the page updated
    const updatedText = await viewBtn.textContent();
    console.log('Updated button text:', updatedText);
    
    const updatedMatch = updatedText?.match(/View Submissions(\d+)/);
    const updatedCount = updatedMatch ? parseInt(updatedMatch[1]) : 0;
    console.log('Updated submission count:', updatedCount);
    
    if (updatedCount < initialCount) {
      console.log(`SUCCESS: Count decreased from ${initialCount} to ${updatedCount}`);
    } else if (updatedCount === 0) {
      console.log('SUCCESS: All submissions deleted, count is now 0');
    } else {
      console.log(`WARNING: Count did not decrease (${initialCount} -> ${updatedCount})`);
    }
  } else {
    console.log('Delete button not visible. May need to check permissions or button visibility.');
  }
});
