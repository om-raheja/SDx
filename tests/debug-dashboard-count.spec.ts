import { test, expect } from '@playwright/test';

test('verify submission count with debug logs', async ({ page }) => {
  // Capture all console logs from the browser
  page.on('console', msg => {
    console.log('Browser Console:', msg.type(), msg.text());
  });

  // Go to sign in page
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  
  // Fill credentials
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  
  // Sign in
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('Signed in successfully');

  // Wait for dashboard to fully load (including teacher submissions)
  await page.waitForTimeout(5000);

  // Get Fish Fight case ID and initial submission count via API
  const casesResult = await page.evaluate(async () => {
    const res = await fetch('/api/cases');
    const cases = await res.json();
    return cases;
  });

  const fishFightCase = casesResult.find((c: any) => c.title === 'Fish Fight');
  if (!fishFightCase) {
    console.log('Fish Fight case not found');
    return;
  }

  const fishFightCaseId = fishFightCase.id;
  console.log('Fish Fight case ID:', fishFightCaseId);

  // Get submissions count via API
  const submissionsResult = await page.evaluate(async () => {
    const res = await fetch('/api/submissions');
    return await res.json();
  });

  const fishFightSubmissions = submissionsResult.filter((s: any) => s.case_id === fishFightCaseId);
  console.log('API submission count for Fish Fight:', fishFightSubmissions.length);

  // Now check the dashboard display
  const fishFightContainer = page.locator('div.rounded-lg.border:has-text("Fish Fight")').first();
  const viewSubmissionsButton = fishFightContainer.locator('button:has-text("View Submissions")');
  const buttonText = await viewSubmissionsButton.textContent();
  console.log('Dashboard button text:', buttonText);

  let displayCount = 0;
  if (buttonText) {
    const match = buttonText.match(/View Submissions(\d+)/);
    if (match) {
      displayCount = parseInt(match[1]);
      console.log('Displayed count:', displayCount);
      console.log('Mismatch? API count:', fishFightSubmissions.length, 'Displayed:', displayCount);
      
      // They should match
      expect(displayCount).toBe(fishFightSubmissions.length);
    }
  }
});