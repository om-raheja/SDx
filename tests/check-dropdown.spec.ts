import { test, expect } from '@playwright/test';

test('check Fish Fight dropdown shows all submissions', async ({ page }) => {
  // Go to LOCAL dev server
  await page.goto('http://localhost:3001/auth/signin');
  
  // Sign in
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  // Wait for dashboard to load
  await page.waitForTimeout(5000);
  
  // Find Fish Fight case
  const fishFightRow = page.locator('div:has-text("Fish Fight")').filter({ has: page.locator('button:has-text("View Submissions")') }).first();
  await fishFightRow.waitFor({ state: 'visible' });
  
  // Get the submission count from the button
  const viewBtn = fishFightRow.locator('button:has-text("View Submissions")');
  const btnText = await viewBtn.textContent();
  console.log('Button text:', btnText);
  
  // Click to expand
  await viewBtn.click();
  console.log('Clicked View Submissions');
  
  // Wait for dropdown to appear
  await page.waitForTimeout(3000);
  
  // Now let's see what's in the dropdown
  // The submissions are in: fishFightRow > div.border-t > div > div.space-y-2.mb-4
  const dropdownArea = fishFightRow.locator('div.border-t').locator('.space-y-2.mb-4');
  const isVisible = await dropdownArea.isVisible();
  console.log('Dropdown area visible:', isVisible);
  
  // Count the submission items (direct div children)
  const submissionItems = dropdownArea.locator(':scope > div');
  const count = await submissionItems.count();
  console.log(`Found ${count} submission items in dropdown`);
  
  // Get API count for comparison
  const apiResult = await page.evaluate(async () => {
    const casesRes = await fetch('/api/cases');
    const cases = await casesRes.json();
    const fishFight = cases.find((c: any) => c.title === 'Fish Fight');
    
    const subsRes = await fetch('/api/submissions');
    const subs = await subsRes.json();
    
    if (!fishFight) return { expected: 0, msg: 'Fish Fight not found' };
    const fishSubs = subs.filter((s: any) => s.case_id === fishFight.id);
    return { expected: fishSubs.length, submissions: fishSubs };
  });
  
  console.log(`API says ${apiResult.expected} submissions`);
  console.log(`Dropdown shows ${count} items`);
  
  // Print the first few submission items
  for (let i = 0; i < Math.min(count, 3); i++) {
    const text = await submissionItems.nth(i).textContent();
    console.log(`Item ${i+1}: ${text?.substring(0, 100)}`);
  }
  
  // They should match
  expect(count).toBe(apiResult.expected);
  console.log('SUCCESS: Dropdown shows all submissions');
});
