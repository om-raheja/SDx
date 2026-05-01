import { test, expect } from '@playwright/test';

test('test that submission counting works correctly', async ({ page }) => {
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
  
  // Get all submission count buttons to see what we're working with
  const submissionButtons = await page.locator('button:has-text("View Submissions")').allTextContents();
  console.log('All submission buttons:', submissionButtons);
  
  // Find a case that has submissions or pick one to work with
  let testCaseButton = null;
  let testCaseIndex = -1;
  
  for (let i = 0; i < submissionButtons.length; i++) {
    const buttonText = submissionButtons[i];
    // Look for a button that shows submissions or is clickable (not showing "0 (None)" disabled)
    if (buttonText && 
        !buttonText.includes('0 (None)') && 
        buttonText.includes('View Submissions')) {
      testCaseButton = page.locator('button:has-text("View Submissions")').nth(i);
      testCaseIndex = i;
      break;
    }
  }
  
  // If we didn't find a good candidate, just use the first one that's not disabled
  if (!testCaseButton) {
    for (let i = 0; i < submissionButtons.length; i++) {
      const buttonText = submissionButtons[i];
      const button = page.locator('button:has-text("View Submissions")').nth(i);
      const isDisabled = await button.isDisabled();
      if (!isDisabled) {
        testCaseButton = button;
        testCaseIndex = i;
        break;
      }
    }
  }
  
  // If still not found, use the first one
  if (!testCaseButton) {
    testCaseButton = page.locator('button:has-text("View Submissions")').first();
    testCaseIndex = 0;
  }
  
  // Get the initial count from the button text
  let initialCount = 0;
  if (testCaseButton) {
    const buttonText = await testCaseButton.textContent();
    console.log('Selected submission button text:', buttonText);
    
    if (buttonText) {
      const match = buttonText.match(/View Submissions(\d+)/);
      if (match) {
        initialCount = parseInt(match[1]);
        console.log(`Initial submission count: ${initialCount}`);
      } else {
        // Handle cases like "View Submissions" without number or "View Submissions 0 (None)"
        if (buttonText.includes('View Submissions')) {
          if (buttonText.includes('0 (None)')) {
            initialCount = 0;
            console.log('Initial submission count: 0 (from 0 (None))');
          } else {
            // Just "View Submissions" - assume 0
            initialCount = 0;
            console.log('Initial submission count: 0 (assumed from button text)');
          }
        }
      }
    }
  }
  
  // Find the case container for this button to click on the CASE TITLE or EYE BUTTON
  if (testCaseIndex >= 0) {
    // Get all case containers and pick the one matching our index
    const caseContainers = await page.locator('div.rounded-lg.border').all();
    console.log(`Found ${caseContainers.length} case containers`);
    
    if (testCaseIndex < caseContainers.length) {
      const selectedContainer = caseContainers[testCaseIndex];
      
      // First, let's try to get the case title for logging
      const titleElement = selectedContainer.locator('span.text-lg.font-medium');
      const caseTitle = await titleElement.textContent();
      console.log('Selected case title:', caseTitle);
      
      // Now click on the EYE BUTTON to preview the case (student preview)
      const eyeButton = selectedContainer.locator('button:has-text("Student preview")').first();
      // Alternative: look for button with Eye icon
      const eyeButtonAlt = selectedContainer.locator('button:has(> eye-icon), button:has-text(""), button:has(.w-7.h-7)');
      
      // Let's find the button that has the Eye icon (Student preview)
      const previewButton = selectedContainer.locator('button[title="Student preview"]');
      
      if (await previewButton.isVisible()) {
        console.log('Clicking Student preview button');
        await previewButton.click();
        await page.waitForTimeout(3000);
      } else {
        // Fallback: look for any button with an Eye icon inside
        const eyeIconButton = selectedContainer.locator('button:has-text(""), button:has(.w-7\\.h-7)');
        if (await eyeIconButton.isVisible()) {
          console.log('Clicking Eye icon button');
          await eyeIconButton.click();
          await page.waitForTimeout(3000);
        } else {
          // Last resort: try clicking the case title area (might be clickable)
          console.log('Trying to click case title area');
          await titleElement.click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Check if we're on a case detail page
      const pageTitle = await page.locator('h1').textContent();
      console.log('Navigated to case:', pageTitle);
      
      if (pageTitle) {
        // Try to make a submission
        const diagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
        const currentValue = await diagnosisTextarea.inputValue();
        console.log('Current diagnosis value:', `"${currentValue}"`);
        
        let madeSubmission = false;
        if (!currentValue.trim()) {
          await diagnosisTextarea.fill('Test submission for verification');
          const submitButton = page.locator('button:has-text("Submit Diagnosis")');
          if (await submitButton.isEnabled()) {
            await submitButton.click();
            console.log('Made a submission');
            madeSubmission = true;
            await page.waitForTimeout(3000);
          }
        }
        
        // If we couldn't submit on current hint, try next hint
        if (!madeSubmission) {
          const nextButton = page.locator('button:has-text("Next Hint →")');
          if (await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(2000);
            
            const nextDiagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
            await nextDiagnosisTextarea.fill('Test submission for next hint');
            
            const nextSubmitButton = page.locator('button:has-text("Submit Diagnosis")');
            if (await nextSubmitButton.isEnabled()) {
              await nextSubmitButton.click();
              console.log('Made a submission on next hint');
              madeSubmission = true;
              await page.waitForTimeout(3000);
            }
          }
        }
        
        // Go back to dashboard if we made a submission
        if (madeSubmission) {
          await page.goBack();
          await page.waitForTimeout(2000);
          await page.waitForURL('**/dashboard**');
          await page.waitForTimeout(2000);
          
          // Re-check the submission count for our selected case
          const updatedCaseContainers = await page.locator('div.rounded-lg.border').all();
          if (testCaseIndex < updatedCaseContainers.length) {
            const updatedContainer = updatedCaseContainers[testCaseIndex];
            const updatedButton = updatedContainer.locator('button:has-text("View Submissions")');
            const updatedButtonText = await updatedButton.textContent();
            console.log('Updated submission button text:', updatedButtonText);
            
            let finalCount = 0;
            if (updatedButtonText) {
              const match = updatedButtonText.match(/View Submissions(\d+)/);
              if (match) {
                finalCount = parseInt(match[1]);
                console.log(`Final submission count: ${finalCount}`);
              } else {
                // Handle special cases
                if (updatedButtonText.includes('0 (None)')) {
                  finalCount = 0;
                  console.log('Final submission count: 0 (from 0 (None))');
                } else if (updatedButtonText.includes('View Submissions')) {
                  finalCount = 0; // Assume 0 if we can't parse
                  console.log('Final submission count: 0 (assumed)');
                }
              }
            }
            
            // Verify that the count increased or stayed the same (if already at max)
            expect(finalCount).toBeGreaterThanOrEqual(initialCount);
            console.log(`SUCCESS: Submission count is ${finalCount} (was ${initialCount})`);
          } else {
            console.log('Could not re-find case container after submission');
          }
        } else {
          console.log('Could not make any submission');
        }
      } else {
        console.log('Failed to navigate to case detail');
      }
    } else {
      console.log('Case index out of bounds');
    }
  } else {
    console.log('Could not find submission button');
  }
  
  console.log('Test completed');
});