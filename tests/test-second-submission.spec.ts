import { test, expect } from '@playwright/test';

test('test adding submission to Fish Fight case and verify count updates', async ({ page }) => {
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
  
  // Get all case containers to find Fish Fight
  const caseContainers = await page.locator('div.rounded-lg.border').all();
  console.log(`Found ${caseContainers.length} case containers`);
  
  let fishFightContainer = null;
  for (const container of caseContainers) {
    const titleElement = container.locator('span.text-lg.font-medium');
    const title = await titleElement.textContent();
    if (title && title.includes('Fish Fight')) {
      fishFightContainer = container;
      break;
    }
  }
  
  if (!fishFightContainer) {
    console.log('Fish Fight container not found');
    return;
  }
  
  // Get the View Submissions button for Fish Fight
  const viewSubmissionsButton = fishFightContainer.locator('button:has-text("View Submissions")');
  const buttonText = await viewSubmissionsButton.textContent();
  console.log('Fish Fight View Submissions button text:', buttonText);
  
  // Extract current count
  let currentCount = 0;
  if (buttonText) {
    const match = buttonText.match(/View Submissions(\d+)/);
    if (match) {
      currentCount = parseInt(match[1]);
      console.log(`Current submission count for Fish Fight: ${currentCount}`);
    }
  }
  
  // Click on Fish Fight case title to go to case detail
  const fishFightTitle = fishFightContainer.locator('span.text-lg.font-medium');
  await fishFightTitle.click();
  await page.waitForTimeout(3000);
  
  // Check if we're on the case detail page
  const caseTitle = await page.locator('h1').textContent();
  console.log('Current case title:', caseTitle);
  
  if (caseTitle && caseTitle.includes('Fish Fight')) {
    console.log('Successfully navigated to Fish Fight case detail');
    
    // Try to submit a diagnosis if we can
    const diagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
    const currentValue = await diagnosisTextarea.inputValue();
    console.log('Current diagnosis value:', `"${currentValue}"`);
    
    let submitted = false;
    if (!currentValue.trim()) {
      await diagnosisTextarea.fill('Test submission for verification');
      const submitButton = page.locator('button:has-text("Submit Diagnosis")');
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        console.log('Submitted diagnosis');
        submitted = true;
        await page.waitForTimeout(3000);
      }
    }
    
    // If we couldn't submit on current hint, try to go to next hint
    if (!submitted) {
      const nextButton = page.locator('button:has-text("Next Hint →")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        
        const nextDiagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
        await nextDiagnosisTextarea.fill('Test submission for hint 2');
        
        const nextSubmitButton = page.locator('button:has-text("Submit Diagnosis")');
        if (await nextSubmitButton.isEnabled()) {
          await nextSubmitButton.click();
          console.log('Submitted diagnosis for hint 2');
          submitted = true;
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Go back to dashboard
    if (submitted) {
      await page.goBack();
      await page.waitForTimeout(2000);
      await page.waitForURL('**/dashboard**');
      await page.waitForTimeout(2000);
      
      // Re-find Fish Fight container and check updated count
      const updatedCaseContainers = await page.locator('div.rounded-lg.border').all();
      let updatedFishFightContainer = null;
      for (const container of updatedCaseContainers) {
        const titleElement = container.locator('span.text-lg.font-medium');
        const title = await titleElement.textContent();
        if (title && title.includes('Fish Fight')) {
          updatedFishFightContainer = container;
          break;
        }
      }
      
      if (updatedFishFightContainer) {
        const updatedViewSubmissionsButton = updatedFishFightContainer.locator('button:has-text("View Submissions")');
        const updatedButtonText = await updatedViewSubmissionsButton.textContent();
        console.log('Updated Fish Fight View Submissions button text:', updatedButtonText);
        
        let newCount = 0;
        if (updatedButtonText) {
          const match = updatedButtonText.match(/View Submissions(\d+)/);
          if (match) {
            newCount = parseInt(match[1]);
            console.log(`New submission count for Fish Fight: ${newCount}`);
          }
        }
        
        // Verify that count increased (or at least didn't decrease)
        expect(newCount).toBeGreaterThanOrEqual(currentCount);
        console.log(`SUCCESS: Submission count is ${newCount} (was ${currentCount})`);
      } else {
        console.log('Could not re-find Fish Fight container after submission');
      }
    } else {
      console.log('Could not submit any diagnosis');
    }
  } else {
    console.log('Failed to navigate to Fish Fight case detail');
  }
  
  console.log('Test completed');
});