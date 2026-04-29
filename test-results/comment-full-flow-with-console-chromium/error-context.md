# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comment.spec.ts >> full flow with console
- Location: tests/comment.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - heading "SDx Lab Teacher" [level=1] [ref=e4]
      - generic [ref=e5]:
        - button [ref=e6]:
          - img [ref=e7]
        - button "Teacher" [ref=e9]
        - button "Sign Out" [ref=e10]
    - main [ref=e11]:
      - heading "Available Cases" [level=2] [ref=e12]
      - button "Create New Case" [ref=e13]:
        - img [ref=e14]
        - generic [ref=e16]: Create New Case
      - generic [ref=e17]:
        - button "67 →" [ref=e18]:
          - generic [ref=e19]: "67"
          - generic [ref=e20]: →
        - button "Bloody diarrhea in Teen with Hereditary spherocytosis →" [ref=e21]:
          - generic [ref=e22]: Bloody diarrhea in Teen with Hereditary spherocytosis
          - generic [ref=e23]: →
  - alert [ref=e24]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('full flow with console', async ({ page }) => {
  4  |   page.on('console', msg => console.log('Console:', msg.text()));
  5  |   page.on('pageerror', err => console.log('Error:', err.message));
  6  |   
  7  |   // Sign in
  8  |   await page.goto('https://sdxlab.vercel.app/auth/signin');
  9  |   await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  10 |   await page.fill('input[placeholder="Password"]', 'October32018!');
  11 |   await page.click('button:has-text("Sign In")');
  12 |   await page.waitForURL(/\/dashboard/);
  13 |   
  14 |   // Create case
  15 |   await page.goto('https://sdxlab.vercel.app/teacher/create');
  16 |   await page.waitForTimeout(2000);
  17 |   await page.locator('input[placeholder]').first().fill('Case ' + Date.now());
  18 |   await page.locator('textarea').nth(0).fill('Hint 1');
  19 |   await page.locator('textarea').nth(1).fill('Hint 2');
  20 |   await page.click('button:has-text("Create Case")');
  21 |   await page.waitForURL(/\/teacher/, { timeout: 15000 });
  22 |   
  23 |   // Dashboard
  24 |   await page.goto('https://sdxlab.vercel.app/dashboard');
  25 |   await page.waitForTimeout(2000);
  26 |   
  27 |   // Submit via direct URL
  28 |   await page.goto('https://sdxlab.vercel.app/dashboard');
  29 |   const btns = page.locator('button');
  30 |   for (let i = 0; i < await btns.count(); i++) {
  31 |     const txt = await btns.nth(i).textContent();
  32 |     if (txt && txt.includes('←') && !txt.includes('Back')) {
  33 |       await btns.nth(i).click();
  34 |       break;
  35 |     }
  36 |   }
  37 |   await page.waitForTimeout(2000);
  38 |   
  39 |   // Submit
  40 |   const area = page.locator('textarea').first();
> 41 |   await area.fill('Test diagnosis');
     |              ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  42 |   const submit = page.locator('button:has-text("Submit")').first();
  43 |   await submit.click();
  44 |   await page.waitForTimeout(2000);
  45 |   
  46 |   // Teacher
  47 |   await page.goto('https://sdxlab.vercel.app/teacher');
  48 |   await page.waitForTimeout(3000);
  49 |   
  50 |   const addBtn = page.locator('button:has-text("Add Comment")').first();
  51 |   if (await addBtn.isVisible({ timeout: 5000 })) {
  52 |     await addBtn.click();
  53 |     await page.waitForTimeout(500);
  54 |     await page.fill('input[placeholder="Write a comment..."]', 'Test comment');
  55 |     await page.click('button:has-text("Send")');
  56 |     await page.waitForTimeout(3000);
  57 |     
  58 |     // Get input value again to check
  59 |     const inputVal = await page.locator('input[placeholder="Write a comment..."]').inputValue();
  60 |     console.log('Input value after:', inputVal);
  61 |     
  62 |     const shown = await page.locator('text=Test comment').isVisible();
  63 |     console.log('Comment shown:', shown);
  64 |   }
  65 | });
```