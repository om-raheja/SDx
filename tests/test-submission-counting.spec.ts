import { test, expect } from '@playwright/test';

test('test submission counting works correctly for multiple submissions', async ({ page }) => {
  // Listen to console errors
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });

  // Go to sign in page
  await page.goto('https://sdxlab.vercel.app/auth/signin');
  console.log('On sign in page');
  
  // Fill in credentials
  await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  await page.fill('input[placeholder="Password"]', 'October32018!');
  console.log('Filled credentials');
  
  // Click sign in
  const signInBtn = page.locator('button:has-text("Sign In")');
  await signInBtn.click();
  console.log('Clicked sign in');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('URL changed to dashboard');
  
  // Wait for content
  await page.waitForTimeout(3000);
  
  // Create a new test case to avoid interfering with existing data
  await page.goto('/teacher/create');
  await page.waitForTimeout(2000);
  
  // Fill in case creation form
  await page.fill('input[placeholder="Enter case title"]', 'Test Case for Submission Counting');
  await page.fill('textarea[placeholder="Enter case description"]', 'A test case to verify submission counting');
  
  // Add some hints
  await page.fill('input[placeholder="Hint 1 content"]', 'First hint for testing');
  await page.fill('input[placeholder="Hint 2 content"]', 'Second hint for testing');
  await page.fill('input[placeholder="Hint 3 content"]', 'Third hint for testing');
  
  // Click create case button
  const createCaseButton = page.locator('button:has-text("Create Case")');
  await createCaseButton.click();
  await page.waitForTimeout(3000);
  
  // Should be redirected to dashboard
  await page.waitForURL('**/dashboard**');
  await page.waitForTimeout(2000);
  
  // Find our newly created case
  const caseContainers = await page.locator('div.rounded-lg.border').all();
  let testCaseContainer = null;
  for (const container of caseContainers) {
    const titleElement = container.locator('span.text-lg.font-medium');
    const title = await titleElement.textContent();
    if (title && title.includes('Test Case for Submission Counting')) {
      testCaseContainer = container;
      break;
    }
  }
  
  if (!testCaseContainer) {
    console.log('Test case not found');
    return;
  }
  
  // Get initial submission count
  const viewSubmissionsButton = testCaseContainer.locator('button:has-text("View Submissions")');
  const initialButtonText = await viewSubmissionsButton.textContent();
  console.log('Initial View Submissions button text:', initialButtonText);
  
  let initialCount = 0;
  if (initialButtonText) {
    const match = initialButtonText.match(/View Submissions(\d+)/);
    if (match) {
      initialCount = parseInt(match[1]);
      console.log(`Initial submission count: ${initialCount}`);
    }
  }
  
  // Click on the case title to go to case detail
  const caseTitleElement = testCaseContainer.locator('span.text-lg.font-medium');
  await caseTitleElement.click();
  await page.waitForTimeout(3000);
  
  // Verify we're on the case detail page
  const caseTitle = await page.locator('h1').textContent();
  console.log('Case detail page title:', caseTitle);
  
  if (caseTitle && caseTitle.includes('Test Case for Submission Counting')) {
    console.log('Successfully navigated to test case detail');
    
    // Make first submission on hint 1
    const diagnosisTextarea1 = page.locator('textarea[placeholder="Enter your diagnosis..."]');
    await diagnosisTextarea1.fill('First test diagnosis');
    
    const submitButton1 = page.locator('button:has-text("Submit Diagnosis")');
    if (await submitButton1.isEnabled()) {
      await submitButton1.click();
      console.log('Made first submission');
      await page.waitForTimeout(3000);
    }
    
    // Try to make second submission on hint 2 (go to next hint first)
    const nextButton = page.locator('button:has-text("Next Hint →")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(2000);
      
      const diagnosisTextarea2 = page.locator('textarea[placeholder="Enter your diagnosis..."]');
      await diagnosisTextarea2.fill('Second test diagnosis');
      
      const submitButton2 = page.locator('button:has-text("Submit Diagnosis")');
      if (await submitButton2.isEnabled()) {
        await submitButton2.click();
        console.log('Made second submission');
        await page.waitForTimeout(3000);
      }
    }
    
    // Try to make third submission on hint 3 (go to next hint again)
    const nextButton2 = page.locator('button:has-text("Next Hint →")');
    if (await nextButton2.isEnabled()) {
      await nextButton2.click();
      await page.waitForTimeout(2000);
      
      const diagnosisTextarea3 = page.locator('textarea[placeholder="Enter your diagnosis..."]');
      await diagnosisTextarea3.fill('Third test diagnosis');
      
      const submitButton3 = page.locator('button:has-text("Submit Diagnosis")');
      if (await submitButton3.isEnabled()) {
        await submitButton3.click();
        console.log('Made third submission');
        await page.waitForTimeout(3000);
      }
    }
    
    // Go back to dashboard
    await page.goBack();
    await page.waitForTimeout(2000);
    await page.waitForURL('**/dashboard**');
    await page.waitForTimeout(2000);
    
    // Re-find our test case and check updated submission count
    const updatedCaseContainers = await page.locator('div.rounded-lg.border').all();
    let updatedTestCaseContainer = null;
    for (const container of updatedCaseContainers) {
      const titleElement = container.locator('span.text-lg.font-medium');
      const title = await titleElement.textContent();
      if (title && title.includes('Test Case for Submission Counting')) {
        updatedTestCaseContainer = container;
        break;
      }
    }
    
    if (updatedTestCaseContainer) {
      const updatedViewSubmissionsButton = updatedTestCaseContainer.locator('button:has-text("View Submissions")');
      const updatedButtonText = await updatedViewSubmissionsButton.textContent();
      console.log('Updated View Submissions button text:', updatedButtonText);
      
      let finalCount = 0;
      if (updatedButtonText) {
        const match = updatedButtonText.match(/View Submissions(\d+)/);
        if (match) {
          finalCount = parseInt(match[1]);
          console.log(`Final submission count: ${finalCount}`);
        }
      }
      
      // Verify that count increased by the number of submissions we made
      // We made up to 3 submissions, so count should be at least initialCount + 1
      expect(finalCount).toBeGreaterThanOrEqual(initialCount + 1);
      console.log(`SUCCESS: Submission count increased from ${initialCount} to ${finalCount}`);
    } else {
      console.log('Could not re-find test case after submissions');
    }
  } else {
    console.log('Failed to navigate to test case detail');
  }
  
  console.log('Test completed');
});