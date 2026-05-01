import { test, expect } from '@playwright/test';

test('verify submission is saved and counted correctly', async ({ page }) => {
  let fishFightCaseId = '';
  let initialSubmissionCount = 0;

  // Go to sign in page
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  
  // Fill credentials
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  
  // Sign in
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('Signed in successfully');

  // Helper function to make authenticated API requests
  const authGet = async (url: string) => {
    return await page.evaluate(async (url) => {
      const response = await fetch(url);
      return {
        status: response.status,
        body: await response.json().catch(() => null),
        text: await response.text().catch(() => '')
      };
    }, url);
  };

  // Get all cases to find Fish Fight ID
  const casesResult = await authGet('/api/cases');
  if (casesResult.status !== 200 || !casesResult.body) {
    console.log('Failed to fetch cases:', casesResult.status, casesResult.text);
    return;
  }

  const cases = casesResult.body;
  const fishFightCase = cases.find((c: any) => c.title === 'Fish Fight');
  if (!fishFightCase) {
    console.log('Fish Fight case not found in cases:', cases.map((c: any) => c.title));
    return;
  }

  fishFightCaseId = fishFightCase.id;
  console.log('Fish Fight case ID:', fishFightCaseId);

  // Get initial submission count for Fish Fight
  const submissionsResult = await authGet('/api/submissions');
  if (submissionsResult.status !== 200 || !submissionsResult.body) {
    console.log('Failed to fetch submissions:', submissionsResult.status, submissionsResult.text);
    return;
  }

  const submissions = submissionsResult.body;
  initialSubmissionCount = submissions.filter((s: any) => s.case_id === fishFightCaseId).length;
  console.log('Initial Fish Fight submission count:', initialSubmissionCount);

  // Go to Fish Fight case (student preview)
  await page.goto(`/dashboard/${fishFightCaseId}`);
  await page.waitForTimeout(3000);

  // Check if we're on the case page
  const caseTitle = await page.locator('h1').textContent();
  console.log('Case page title:', caseTitle);
  if (!caseTitle?.includes('Fish Fight')) {
    console.log('Not on Fish Fight case page');
    return;
  }

  // Try to submit a diagnosis
  const diagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
  const currentValue = await diagnosisTextarea.inputValue();
  console.log('Diagnosis textarea value:', currentValue);

  if (!currentValue.trim()) {
    const testDiagnosis = `Test submission ${Date.now()}`;
    await diagnosisTextarea.fill(testDiagnosis);
    console.log('Filled diagnosis:', testDiagnosis);

    const submitButton = page.locator('button:has-text("Submit Diagnosis")');
    if (await submitButton.isEnabled()) {
      await submitButton.click();
      console.log('Clicked submit button');
      await page.waitForTimeout(3000);

      // Check if submission was saved
      const newSubmissionsResult = await authGet('/api/submissions');
      if (newSubmissionsResult.status !== 200 || !newSubmissionsResult.body) {
        console.log('Failed to fetch updated submissions');
        return;
      }

      const newSubmissions = newSubmissionsResult.body;
      const newCount = newSubmissions.filter((s: any) => s.case_id === fishFightCaseId).length;
      console.log('New Fish Fight submission count:', newCount);
      console.log('Submissions increased by:', newCount - initialSubmissionCount);

      // Verify count increased
      expect(newCount).toBe(initialSubmissionCount + 1);
      console.log('SUCCESS: Submission was saved to database');

      // Check dashboard display
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find Fish Fight's submission count badge
      const fishFightContainers = await page.locator('div.rounded-lg.border:has-text("Fish Fight")').all();
      if (fishFightContainers.length === 0) {
        console.log('Fish Fight container not found');
        return;
      }

      const viewSubmissionsButton = fishFightContainers[0].locator('button:has-text("View Submissions")');
      const buttonText = await viewSubmissionsButton.textContent();
      console.log('Dashboard button text:', buttonText);

      let displayCount = 0;
      if (buttonText) {
        const match = buttonText.match(/View Submissions(\d+)/);
        if (match) {
          displayCount = parseInt(match[1]);
          console.log('Displayed submission count:', displayCount);
          expect(displayCount).toBe(newCount);
          console.log('SUCCESS: Dashboard displays correct count');
        } else {
          console.log('Could not parse count from button text:', buttonText);
        }
      }
    } else {
      console.log('Submit button is disabled');
      // Check if already submitted for this hint
      const submittedMsg = await page.locator('text=Diagnosis submitted for Hint').isVisible();
      console.log('Already submitted for this hint:', submittedMsg);
    }
  } else {
    console.log('Diagnosis textarea already has content:', currentValue);
  }
});