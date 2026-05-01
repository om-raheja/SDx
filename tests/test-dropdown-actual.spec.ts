import { test, expect } from '@playwright/test';

test('check dropdown shows all Fish Fight submissions', async ({ page }) => {
  // Go to sign in
  await page.goto('http://localhost:3000/auth/signin');
  
  // Sign in
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  // Wait for dashboard to fully load
  await page.waitForTimeout(5000);
  
  // Find Fish Fight case
  const fishFightContainer = page.locator('div.rounded-lg.border:has-text("Fish Fight")').first();
  await fishFightContainer.waitFor({ state: 'visible' });
  
  // Get the submission count from the button
  const viewBtn = fishFightContainer.locator('button:has-text("View Submissions")');
  const btnText = await viewBtn.textContent();
  console.log('Button text:', btnText);
  
  // Click to expand
  await viewBtn.click();
  console.log('Clicked View Submissions');
  
  // Wait for dropdown to appear
  await page.waitForTimeout(2000);
  
  // Check if dropdown expanded
  const dropdown = fishFightContainer.locator('div.border-t.border-zinc-200:has(.space-y-2.mb-4)');
  const isVisible = await dropdown.isVisible();
  console.log('Dropdown visible:', isVisible);
  
  // Count submission items
  const submissionItems = fishFightContainer.locator('.space-y-2.mb-4 > div');
  const count = await submissionItems.count();
  console.log(`Found ${count} submission items in dropdown`);
  
  // Get API count
  const apiSubmissions = await page.evaluate(async () => {
    const res = await fetch('/api/submissions');
    const subs = await res.json();
    const casesRes = await fetch('/api/cases');
    const cases = await casesRes.json();
    const fishFight = cases.find((c: any) => c.title === 'Fish Fight');
    if (!fishFight) return { expected: 0, msg: 'Fish Fight not found' };
    const fishSubs = subs.filter((s: any) => s.case_id === fishFight.id);
    return { expected: fishSubs.length, submissions: fishSubs };
  });
  
  console.log(`API says ${apiSubmissions.expected} submissions for Fish Fight`);
  console.log(`Dropdown shows ${count} items`);
  
  // Log the actual submission items
  for (let i = 0; i < Math.min(count, 5); i++) {
    const text = await submissionItems.nth(i).textContent();
    console.log(`Item ${i+1}: ${text?.substring(0, 100)}`);
  }
  
  // Check if they match
  if (count !== apiSubmissions.expected) {
    console.log(`MISMATCH: Dropdown shows ${count}, API says ${apiSubmissions.expected}`);
    
    // Debug: check if submissions are in the DOM but hidden
    const allDivs = fishFightContainer.locator('.space-y-2.mb-4 div[class*="bg-zinc"]');
    const allCount = await allDivs.count();
    console.log(`All divs with bg-zinc class: ${allCount}`);
  }
  
  expect(count).toBe(apiSubmissions.expected);
});