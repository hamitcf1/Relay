# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-mobile.spec.ts >> Responsive Mobile Experience >> TC-DASH-001: Mobile viewport renders layout cleanly without horizontal scroll
- Location: tests/e2e/responsive-mobile.spec.ts:13:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
Call log:
  - navigating to "http://localhost:5174/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Suite: Responsive & Mobile Layout
  5  |  * Documentation: docs/qa/TEST_CASES.md (TC-DASH-001)
  6  |  */
  7  | test.describe('Responsive Mobile Experience', () => {
  8  | 
  9  |   /**
  10 |    * TC-DASH-001: Mobil Uyumluluk Kontrolü
  11 |    * Neyi/Niye Test Ediyoruz: Mobil tarayıcı çözünürlüğünde sayfanın yatay kaydırma yapmadan duyarlı render edildiğini kontrol eder.
  12 |    */
  13 |   test('TC-DASH-001: Mobile viewport renders layout cleanly without horizontal scroll', async ({ page }) => {
> 14 |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
  15 | 
  16 |     // Evaluate viewport width vs scroll width
  17 |     const isOverflowing = await page.evaluate(() => {
  18 |       return document.documentElement.scrollWidth > window.innerWidth;
  19 |     });
  20 | 
  21 |     expect(isOverflowing).toBe(false);
  22 |   });
  23 | 
  24 | });
  25 | 
```