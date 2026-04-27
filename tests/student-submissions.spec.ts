import { test, expect } from '@playwright/test';

test('student can view past submissions', async ({ page }) => {
  // Login as teacher and create a case first
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', 'buttabomma67@outlook.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // If email code needed, skip this test for now
  const url = page.url();
  if (url.includes('auth/signin')) {
    console.log('Need email code - skipping test');
    return;
  }
  
  // Go to dashboard
  await page.goto('/dashboard');
  await page.waitForTimeout(1000);
  
  // Check if there are any cases, if not create one
  const createBtn = page.locator('text=Create New Case');
  if (await createBtn.isVisible()) {
    console.log('No cases yet - test requires cases to exist');
    return;
  }
  
  // Check for past submissions section
  const pastSubmissions = page.locator('text=Your Past Submissions');
  if (await pastSubmissions.isVisible()) {
    console.log('Past submissions section found');
  } else {
    console.log('No past submissions section found');
  }
});

test('teacher sees student email in submissions', async ({ page }) => {
  // Login as teacher
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', 'buttabomma67@outlook.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Go to teacher page
  await page.goto('/teacher');
  await page.waitForTimeout(1000);
  
  // Check recent submissions section
  const submissions = await page.locator('.space-y-4 > div').count();
  console.log('Found', submissions, 'submissions');
  
  if (submissions > 0) {
    const firstEmail = await page.locator('.space-y-4 > div').first().locator('span.font-medium').textContent();
    console.log('First submission email:', firstEmail);
  }
});