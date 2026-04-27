import { test, expect } from '@playwright/test';

test('teacher login flow', async ({ page, context }) => {
  // Navigate to signin
  await page.goto('/auth/signin');
  
  // Enter email
  await page.fill('input[type="email"]', 'buttabomma67@outlook.com');
  await page.click('button[type="submit"]');
  
  // Wait for code input (if sent)
  await page.waitForTimeout(3000);
  
  // Check cookies
  const cookies = await context.cookies();
  console.log('Cookies after send:', cookies.map(c => c.name));
  
  // Check auth/me
  const meResp = await page.evaluate(async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    return res.json();
  });
  console.log('Auth /me response:', meResp);
  
  // Check if we got a role
  console.log('User role:', meResp.role);
});