# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-demo.spec.ts >> Live Demo & Simulation >> TC-DEMO-002: Clicking demo login button authenticates demo session and navigates into /dashboard
- Location: tests/e2e/live-demo.spec.ts:29:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/live-demo
Call log:
  - navigating to "http://localhost:5174/live-demo", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Suite: Live Demo & Simulation Sandbox
  5  |  * Documentation: docs/qa/TEST_CASES.md (TC-DEMO-001, TC-DEMO-002)
  6  |  */
  7  | test.describe('Live Demo & Simulation', () => {
  8  | 
  9  |   /**
  10 |    * TC-DEMO-001: Canlı Demo (Live Demo) Rol Kartlarının Görüntülenmesi
  11 |    * Neyi/Niye Test Ediyoruz: Live Demo sayfasında GM ve Resepsiyonist demo role kartlarının butonlarıyla birlikte görüntülendiğini doğrular.
  12 |    */
  13 |   test('TC-DEMO-001: Live Demo page renders GM and Staff demo cards', async ({ page }) => {
  14 |     await page.goto('/live-demo');
  15 |     await expect(page).toHaveURL(/\/live-demo/);
  16 | 
  17 |     const heading = page.locator('h1').first();
  18 |     await expect(heading).toBeVisible({ timeout: 10000 });
  19 | 
  20 |     // Verify demo selection buttons exist
  21 |     const demoButtons = page.locator('button');
  22 |     await expect(demoButtons.first()).toBeVisible();
  23 |   });
  24 | 
  25 |   /**
  26 |    * TC-DEMO-002: Live Demo Rol Seçimi ve Dashboard Paneline Otomatik Giriş
  27 |    * Neyi/Niye Test Ediyoruz: Kullanıcı Live Demo sayfasında "Demo Girişi Yap" butonuna tıkladığında demo oturumunun açılıp doğrudan /dashboard ekranına aktarıldığını ve operasyonel panellerin yüklendiğini test eder.
  28 |    */
  29 |   test('TC-DEMO-002: Clicking demo login button authenticates demo session and navigates into /dashboard', async ({ page }) => {
> 30 |     await page.goto('/live-demo');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/live-demo
  31 | 
  32 |     // Click the first demo role button (e.g. GM or Staff Demo)
  33 |     const demoLoginBtn = page.locator('button').first();
  34 |     await expect(demoLoginBtn).toBeVisible({ timeout: 10000 });
  35 |     await demoLoginBtn.click();
  36 | 
  37 |     // Wait for automatic redirection to /dashboard
  38 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  39 | 
  40 |     // Verify dashboard elements (sidebar, brand mark or main container) load cleanly
  41 |     const dashboardBody = page.locator('body');
  42 |     await expect(dashboardBody).toBeVisible();
  43 |   });
  44 | 
  45 | });
  46 | 
```