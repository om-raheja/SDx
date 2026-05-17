import { test, expect } from '@playwright/test';

const BASE_URL = 'https://sdxlab.vercel.app';
const TEACHER_EMAIL = 'buttabomma67@outlook.com';
const TEACHER_PASSWORD = 'October32018!';

async function loginAsTeacher(page: any) {
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.fill('input[placeholder="Email"]', TEACHER_EMAIL);
  await page.fill('input[placeholder="Password"]', TEACHER_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Authentication', () => {
  test('signin page loads with all auth methods', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    await expect(page.getByRole('heading', { name: 'SDx Lab' })).toBeVisible();
    await expect(page.getByText('Continue with Google')).toBeVisible();
    await expect(page.getByText('Continue with Microsoft')).toBeVisible();
    await expect(page.getByText('Magic Link')).toBeVisible();
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test('login with valid credentials', async ({ page }) => {
    await loginAsTeacher(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[placeholder="Email"]', 'nobody@example.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
  });

  test('forgot password form works', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.click('button:has-text("Forgot password?")');
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.click('button:has-text("Send Reset Link")');
    await expect(page.getByText('Sending...')).toBeVisible();
  });

  test('reset password page handles missing token', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);
    await expect(page.getByRole('heading', { name: 'Invalid Link' })).toBeVisible();
  });

  test('reset password page validates password match', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password?token=fake-token`);
    await page.fill('input[placeholder="New password"]', 'short');
    await page.fill('input[placeholder="Confirm new password"]', 'different');
    await page.click('button:has-text("Reset Password")');
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('sign out works', async ({ page }) => {
    await loginAsTeacher(page);
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });
  });
});

test.describe('Case Creation', () => {
  test('create case with minimum 2 hints', async ({ page }) => {
    await loginAsTeacher(page);
    await page.click('button:has-text("Create New Case")');
    await page.waitForURL(/\/teacher\/create/);

    await page.fill('input[placeholder="e.g., Chest Pain Case"]', 'Test Case Min Hints');
    await page.locator('input[type="number"]').fill('2');
    await page.waitForTimeout(500);

    expect(await page.locator('textarea').count()).toBeGreaterThanOrEqual(2);

    await page.locator('textarea').nth(0).fill('First hint');
    await page.locator('textarea').nth(1).fill('Second hint');

    await page.click('button:has-text("Create Case")');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('create case with labs field', async ({ page }) => {
    await loginAsTeacher(page);
    await page.click('button:has-text("Create New Case")');
    await page.waitForURL(/\/teacher\/create/);

    await page.fill('input[placeholder="e.g., Chest Pain Case"]', 'Test Case With Labs');
    await page.locator('input[type="number"]').fill('2');
    await page.waitForTimeout(500);

    await page.locator('textarea').nth(0).fill('Hint with labs');
    const labsInputs = page.locator('input[placeholder="Lab values (optional)..."]');
    await expect(labsInputs.first()).toBeVisible();
    await labsInputs.nth(0).fill('Na: 140, K: 4.0');

    await page.locator('textarea').nth(1).fill('Second hint');
    await labsInputs.nth(1).fill('WBC: 12.0');

    await page.click('button:has-text("Create Case")');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('validation: title required', async ({ page }) => {
    await loginAsTeacher(page);
    await page.click('button:has-text("Create New Case")');
    await page.waitForURL(/\/teacher\/create/);

    await page.locator('input[type="number"]').fill('2');
    await page.waitForTimeout(500);
    await page.locator('textarea').nth(0).fill('Hint 1');
    await page.locator('textarea').nth(1).fill('Hint 2');

    await page.click('button:has-text("Create Case")');
    await expect(page.getByText('Title required')).toBeVisible({ timeout: 5000 });
  });

  test('validation: all hints must be filled', async ({ page }) => {
    await loginAsTeacher(page);
    await page.click('button:has-text("Create New Case")');
    await page.waitForURL(/\/teacher\/create/);

    await page.fill('input[placeholder="e.g., Chest Pain Case"]', 'Incomplete Case');
    await page.locator('input[type="number"]').fill('3');
    await page.waitForTimeout(500);

    await page.locator('textarea').nth(0).fill('Only first hint');

    await page.click('button:has-text("Create Case")');
    await expect(page.getByText('Please fill in all 3 hints')).toBeVisible({ timeout: 5000 });
  });

  test('hint count slider updates form fields', async ({ page }) => {
    await loginAsTeacher(page);
    await page.click('button:has-text("Create New Case")');
    await page.waitForURL(/\/teacher\/create/);

    await page.locator('input[type="number"]').fill('5');
    await page.waitForTimeout(500);
    expect(await page.locator('textarea').count()).toBeGreaterThanOrEqual(5);

    await page.locator('input[type="number"]').fill('2');
    await page.waitForTimeout(500);
    expect(await page.locator('textarea').count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Student Case Detail', () => {
  test('navigate hints correctly', async ({ page }) => {
    await loginAsTeacher(page);
    const cases = await page.locator('text=Test Case Min Hints').all();
    if (cases.length === 0) {
      test.skip();
      return;
    }

    const eyeBtn = page.locator('button[title="Student preview"]').first();
    await eyeBtn.click();
    await page.waitForURL(/\/dashboard\/[^\/]+$/, { timeout: 10000 });

    await expect(page.getByRole('heading', { name: 'Test Case Min Hints' })).toBeVisible();
    await expect(page.getByText('Hint 1 of 2')).toBeVisible();
  });

  test('submit diagnosis and advance to next hint', async ({ page }) => {
    await loginAsTeacher(page);
    const cases = await page.locator('text=Test Case Min Hints').all();
    if (cases.length === 0) {
      test.skip();
      return;
    }

    await page.locator('button[title="Student preview"]').first().click();
    await page.waitForURL(/\/dashboard\/[^\/]+$/, { timeout: 10000 });

    await page.fill('textarea[placeholder="Enter your diagnosis..."]', 'My diagnosis for hint 1');
    await page.click('button:has-text("Submit Diagnosis")');

    await page.waitForTimeout(2000);
    await expect(page.getByText('Diagnosis submitted for Hint 1')).toBeVisible();
    await expect(page.getByText('Next Hint →')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('delete case with confirmation', async ({ page }) => {
    await loginAsTeacher(page);

    const deleteBtn = page.locator('button[title="Delete case"]').first();
    if (await deleteBtn.count() === 0) {
      test.skip();
      return;
    }

    await deleteBtn.click();
    await page.waitForTimeout(2000);

    const cases = await page.locator('text=Test Case Min Hints').all();
    expect(cases.length).toBe(0);
  });

  test('dark mode toggle changes theme', async ({ page }) => {
    await loginAsTeacher(page);

    const darkBtn = page.locator('button').filter({ hasText: /🌙|☀️/ });
    await darkBtn.click();
    await page.waitForTimeout(500);

    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
  });
});

test.describe('API Security', () => {
  test('setup endpoint requires auth', async ({ page }) => {
    const res = await page.request.post(`${BASE_URL}/api/setup`);
    expect(res.status()).toBe(401);
  });

  test('cases endpoint requires auth for POST', async ({ page }) => {
    const res = await page.request.post(`${BASE_URL}/api/cases`, {
      data: { title: 'Test', hints: [{ hint_order: 1, content: 'test' }] }
    });
    expect(res.status()).toBe(401);
  });

  test('submissions endpoint requires auth', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/submissions`);
    expect(res.status()).toBe(401);
  });
});
