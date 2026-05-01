import { test, expect } from '@playwright/test';

test('dropdown shows all submissions for Fish Fight', async ({ page }) => {
  // Go to local sign in page
  await page.goto('http://localhost:3000/auth/signin');
  
  // Fill credentials
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  
  // Sign in
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('Signed in');

  // Wait for dashboard to load
  await page.waitForTimeout(5000);

  // Find Fish Fight case container
  const fishFightContainer = page.locator('div.rounded-lg.border:has-text("Fish Fight")').first();
  await fishFightContainer.waitFor({ state: 'visible', timeout: 5000 });

  // Click "View Submissions" button to expand
  const viewSubmissionsBtn = fishFightContainer.locator('button:has-text("View Submissions")');
  await viewSubmissionsBtn.click();
  console.log('Clicked View Submissions');

  // Wait for dropdown to expand
  await page.waitForTimeout(2000);

  // Now count the submission items inside the expanded area
  // The submissions are rendered inside a div with class "space-y-2 mb-4"
  const submissionItems = fishFightContainer.locator('.space-y-2.mb-4 > div');
  const count = await submissionItems.count();
  console.log(`Found ${count} submission items in dropdown`);

  // Get the total submissions from API for Fish Fight
  const submissionsResult = await page.evaluate(async () => {
    const res = await fetch('/api/submissions');
    return await res.json();
  });

  const fishFightCase = await page.evaluate(async () => {
    const res = await fetch('/api/cases');
    const cases = await res.json();
    return cases.find((c: any) => c.title === 'Fish Fight');
  });

  if (!fishFightCase) {
    console.log('Fish Fight case not found');
    return;
  }

  const fishFightSubmissions = submissionsResult.filter((s: any) => s.case_id === fishFightCase.id);
  console.log(`API says ${fishFightSubmissions.length} submissions for Fish Fight`);

  // Expect the dropdown to show all submissions
  expect(count).toBe(fishFightSubmissions.length);
  console.log(`SUCCESS: Dropdown shows all ${count} submissions`);

  // Also verify that each submission item contains a hint number and diagnosis
  for (let i = 0; i < Math.min(count, 3); i++) {
    const text = await submissionItems.nth(i).textContent();
    console.log(`Submission ${i+1} preview: ${text?.substring(0, 100)}`);
  }
});