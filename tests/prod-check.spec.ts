import { test, expect } from '@playwright/test';

test('check production dropdown shows all submissions', async ({ page }) => {
  // Go to production site
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  
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
  // The structure is: fishFightRow > div.border-t > div > div.space-y-2.mb-4 > div (submission items)
  const submissionItems = fishFightRow.locator('.space-y-2.mb-4 > div');
  const count = await submissionItems.count();
  console.log(`Found ${count} submission items in dropdown`);
  
  // Print the first few
  for (let i = 0; i < Math.min(count, 3); i++) {
    const text = await submissionItems.nth(i).textContent();
    console.log(`Item ${i+1}: ${text?.substring(0, 100)}`);
  }
  
  // Get API count
  const apiCount = await page.evaluate(async () => {
    const res = await fetch('/api/submissions');
    const subs = await res.json();
    const casesRes = await fetch('/api/cases');
    const cases = await casesRes.json();
    const fishFight = cases.find((c: any) => c.title === 'Fish Fight');
    if (!fishFight) return 0;
    return subs.filter((s: any) => s.case_id === fishFight.id).length;
  });
  
  console.log(`API says ${apiCount} submissions`);
  console.log(`Dropdown shows ${count} items`);
  
  // They should match
  expect(count).toBe(apiCount);
  console.log('SUCCESS: Dropdown shows all submissions');
});