import { test, expect } from '@playwright/test';

test('verify submission count on local dev', async ({ page }) => {
  // Capture all console logs from the browser
  page.on('console', msg => {
    console.log('Browser Console:', msg.type(), msg.text());
  });

  // Go to local sign in page
  await page.goto('http://localhost:3000/auth/signin');
  
  // Fill credentials
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  
  // Sign in
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('Signed in to local dev server');

  // Wait for dashboard to fully load (including teacher submissions)
  await page.waitForTimeout(5000);

  // Get Fish Fight case ID
  const casesResult = await page.evaluate(async () => {
    const res = await fetch('/api/cases');
    return await res.json();
  });

  const fishFightCase = casesResult.find((c: any) => c.title === 'Fish Fight');
  if (!fishFightCase) {
    console.log('Fish Fight case not found locally');
    return;
  }

  const fishFightCaseId = fishFightCase.id;
  console.log('Fish Fight case ID (local):', fishFightCaseId);

  // Get API submission count
  const submissionsResult = await page.evaluate(async () => {
    const res = await fetch('/api/submissions');
    return await res.json();
  });

  const fishFightSubmissions = submissionsResult.filter((s: any) => s.case_id === fishFightCaseId);
  console.log('API submission count for Fish Fight (local):', fishFightSubmissions.length);

  // Check dashboard display
  const fishFightContainer = page.locator('div.rounded-lg.border:has-text("Fish Fight")').first();
  const viewSubmissionsButton = fishFightContainer.locator('button:has-text("View Submissions")');
  const buttonText = await viewSubmissionsButton.textContent();
  console.log('Dashboard button text (local):', buttonText);

  let displayCount = 0;
  if (buttonText) {
    const match = buttonText.match(/View Submissions(\d+)/);
    if (match) {
      displayCount = parseInt(match[1]);
      console.log('Displayed count (local):', displayCount);
      
      // Check if they match
      if (displayCount === fishFightSubmissions.length) {
        console.log('SUCCESS: Display count matches API count');
      } else {
        console.log('MISMATCH: Display count =', displayCount, 'API count =', fishFightSubmissions.length);
      }
      
      // They should match
      expect(displayCount).toBe(fishFightSubmissions.length);
    }
  }
});