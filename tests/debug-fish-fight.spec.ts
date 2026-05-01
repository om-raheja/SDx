import { test, expect } from '@playwright/test';

test('debug submission to Fish Fight case', async ({ page }) => {
  // Listen to console errors and responses
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/submissions') || 
        response.url().includes('/api/cases/') ||
        response.url().includes('/api/auth/me')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
      try {
        const json = await response.json();
        console.log('API Response Body:', json);
      } catch (e) {
        console.log('API Response Body (text):', await response.text());
      }
    }
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
  
  // Find Fish Fight case
  const fishFightElement = page.locator('text=Fish Fight').first();
  console.log('Fish Fight element found:', await fishFightElement.isVisible());
  
  if (await fishFightElement.isVisible()) {
    // Click on Fish Fight to go to case detail (as teacher preview)
    await fishFightElement.click();
    await page.waitForTimeout(3000);
    
    // Check if we're on the case detail page
    const caseTitle = await page.locator('h1').textContent();
    console.log('Current page title:', caseTitle);
    
    if (caseTitle && caseTitle.includes('Fish Fight')) {
      console.log('Successfully navigated to Fish Fight case detail (teacher view)');
      
      // Let's see what hints are available
      const hintElements = await page.locator('span:has-text("Hint")').all();
      console.log(`Found ${hintElements.length} hint elements`);
      
      for (let i = 0; i < hintElements.length; i++) {
        const hintText = await hintElements[i].textContent();
        console.log(`Hint ${i+1}:`, hintText);
      }
      
      // Check current hint
      const currentHintText = await page.locator('span:has-text("Hint")').first().textContent();
      console.log('Current hint:', currentHintText);
      
      // Get current diagnosis textarea
      const diagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
      const currentValue = await diagnosisTextarea.inputValue();
      console.log('Current diagnosis value:', `"${currentValue}"`);
      
      // Try to submit a diagnosis
      if (!currentValue.trim()) {
        await diagnosisTextarea.fill('Test submission from teacher view');
        console.log('Filled diagnosis textarea');
      }
      
      // Click submit button
      const submitButton = page.locator('button:has-text("Submit Diagnosis")');
      const isSubmitEnabled = await submitButton.isEnabled();
      console.log('Submit button enabled:', isSubmitEnabled);
      
      if (isSubmitEnabled) {
        await submitButton.click();
        console.log('Submitted diagnosis from teacher view');
        await page.waitForTimeout(3000);
        
        // Go back to dashboard
        await page.goBack();
        await page.waitForTimeout(2000);
        await page.waitForURL('**/dashboard**');
        await page.waitForTimeout(2000);
        
        // Check Fish Fight submission count
        const updatedFishFightElement = page.locator('text=Fish Fight').first();
        const fishFightContainer = updatedFishFightElement.locator('xpath=ancestor::div[contains(@class, "rounded-lg") and contains(@class, "border")]');
        const viewSubmissionsButton = fishFightContainer.locator('button:has-text("View Submissions")');
        const buttonText = await viewSubmissionsButton.textContent();
        console.log('Fish Fight View Submissions button text after submission:', buttonText);
        
        let newCount = 0;
        if (buttonText) {
          const match = buttonText.match(/View Submissions(\d+)/);
          if (match) {
            newCount = parseInt(match[1]);
            console.log(`New submission count for Fish Fight: ${newCount}`);
          }
        }
        
        // Also check by looking at all submission buttons
        const allButtons = await page.locator('button:has-text("View Submissions")').allTextContents();
        console.log('All submission buttons after:', allButtons);
        
      } else {
        console.log('Submit button is disabled');
        // Check if there's already a submission for this hint
        const submittedMessage = await page.locator('text=Diagnosis submitted for Hint').isVisible();
        console.log('Diagnosis submitted message visible:', submittedMessage);
        
        // Try to go to next hint
        const nextButton = page.locator('button:has-text("Next Hint →")');
        if (await nextButton.isEnabled()) {
          console.log('Trying next hint');
          await nextButton.click();
          await page.waitForTimeout(2000);
          
          const nextDiagnosisTextarea = page.locator('textarea[placeholder="Enter your diagnosis..."]');
          await nextDiagnosisTextarea.fill('Test submission for hint 2 from teacher view');
          
          const nextSubmitButton = page.locator('button:has-text("Submit Diagnosis")');
          if (await nextSubmitButton.isEnabled()) {
            await nextSubmitButton.click();
            console.log('Submitted diagnosis for hint 2');
            await page.waitForTimeout(3000);
            
            // Go back to dashboard
            await page.goBack();
            await page.waitForTimeout(2000);
            await page.waitForURL('**/dashboard**');
            await page.waitForTimeout(2000);
            
            // Check Fish Fight submission count
            const updatedFishFightElement = page.locator('text=Fish Fight').first();
            const fishFightContainer = updatedFishFightElement.locator('xpath=ancestor::div[contains(@class, "rounded-lg") and contains(@class, "border")]');
            const viewSubmissionsButton = fishFightContainer.locator('button:has-text("View Submissions")');
            const buttonText = await viewSubmissionsButton.textContent();
            console.log('Fish Fight View Submissions button text after second submission:', buttonText);
          }
        }
      }
    } else {
      console.log('Failed to navigate to Fish Fight case detail');
      
      // Let's see what page we're on
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check if we're on the wrong type of case detail (student preview)
      const pageTitle = await page.locator('h1').textContent();
      console.log('Page title:', pageTitle);
      
      // If we're in student preview, let's try to submit as student
      if (pageTitle && !pageTitle.includes('Teacher')) {
        console.log('Appears to be in student preview, trying to submit as student');
        // Similar submission logic as above...
      }
    }
  } else {
    console.log('Fish Fight element not visible');
    
    // Let's see what case elements ARE visible
    const allCaseTitles = await page.locator('span.text-lg.font-medium').allTextContents();
    console.log('All case titles:', allCaseTitles);
  }
  
  console.log('Debug test completed');
});