# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comment.spec.ts >> comment flow
- Location: tests/comment.spec.ts:3:5

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 2
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - heading "Teacher Dashboard" [level=1] [ref=e4]
      - generic [ref=e5]:
        - button "🌙" [ref=e6]
        - button "Create Case" [ref=e7]
        - button "Sign Out" [ref=e8]
    - main [ref=e9]:
      - heading "Cases" [level=2] [ref=e10]
      - generic [ref=e11]:
        - button "67 →" [ref=e12]:
          - generic [ref=e13]: "67"
          - generic [ref=e14]: →
        - button "Bloody diarrhea in Teen with Hereditary spherocytosis →" [ref=e15]:
          - generic [ref=e16]: Bloody diarrhea in Teen with Hereditary spherocytosis
          - generic [ref=e17]: →
      - heading "Student Submissions" [level=2] [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]:
              - heading "buttabomma67@outlook.com" [level=3] [ref=e23]
              - paragraph [ref=e24]: "67"
            - generic [ref=e25]: 4/29/2026, 1:52:51 AM
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e28]: H1
              - generic [ref=e29]: sds
            - generic [ref=e30]:
              - generic [ref=e31]: H2
              - generic [ref=e32]: sdsSD
          - generic [ref=e33]:
            - button "Add Comment" [ref=e34]
            - generic [ref=e36]:
              - textbox "Write a comment..." [ref=e37]
              - button "Send" [active] [ref=e38]
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]:
              - heading "sonia.raheja@gmail.com" [level=3] [ref=e42]
              - paragraph [ref=e43]: Bloody diarrhea in Teen with Hereditary spherocytosis
            - generic [ref=e44]: 4/28/2026, 1:51:25 AM
          - generic [ref=e45]:
            - generic [ref=e46]:
              - generic [ref=e47]: H1
              - generic [ref=e48]: Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
            - generic [ref=e49]:
              - generic [ref=e50]: H2
              - generic [ref=e51]: Infectious gastroenteritis Index Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
            - generic [ref=e52]:
              - generic [ref=e53]: H3
              - generic [ref=e54]: Infectious gastroenteritis Index Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
            - generic [ref=e55]:
              - generic [ref=e56]: H4
              - generic [ref=e57]: Infectious gastroenteritis Inflammatory bowel disease Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
            - generic [ref=e58]:
              - generic [ref=e59]: H5
              - generic [ref=e60]: meckels diverticulum INfectious gastroenteritis Inflammatory bowel disease Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
            - generic [ref=e61]:
              - generic [ref=e62]: H6
              - generic [ref=e63]: meckels diverticulum INfectious gastroenteritis Inflammatory bowel disease Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
            - generic [ref=e64]:
              - generic [ref=e65]: H7
              - generic [ref=e66]: Hemolysis Hereditary spherocytosis meckels diverticulum INfectious gastroenteritis Inflammatory bowel disease Hemolytic anemia Syncope Dehydration Acute Gastroenteritis
          - button "Add Comment" [ref=e68]
  - alert [ref=e69]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('comment flow', async ({ page }) => {
  4  |   await page.goto('https://sdxlab.vercel.app/auth/signin');
  5  |   await page.fill('input[placeholder="Email"]', 'buttabomma67@outlook.com');
  6  |   await page.fill('input[placeholder="Password"]', 'October32018!');
  7  |   await page.click('button:has-text("Sign In")');
  8  |   await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  9  |   
  10 |   await page.goto('https://sdxlab.vercel.app/teacher');
  11 |   await page.waitForTimeout(3000);
  12 |   
  13 |   const btn = page.locator('button:has-text("Add Comment")').first();
  14 |   if (await btn.isVisible()) {
  15 |     const initialCount = await page.locator('text=Comment').count();
  16 |     console.log('Initial comments:', initialCount);
  17 |     
  18 |     await btn.click();
  19 |     await page.waitForTimeout(500);
  20 |     await page.fill('input[placeholder="Write a comment..."]', 'Test comment ' + Date.now());
  21 |     await page.click('button:has-text("Send")');
  22 |     await page.waitForTimeout(3000);
  23 |     
  24 |     const finalCount = await page.locator('text=Test comment').count();
  25 |     console.log('Final comments:', finalCount);
> 26 |     expect(finalCount).toBeGreaterThan(initialCount);
     |                        ^ Error: expect(received).toBeGreaterThan(expected)
  27 |   } else {
  28 |     console.log('No submissions');
  29 |   }
  30 | });
```