# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public & Marketing Pages >> TC-PUB-003: Features page loads module overview cards
- Location: tests/e2e/public-pages.spec.ts:46:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/features
Call log:
  - navigating to "http://localhost:5174/features", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Suite: Public & Marketing Pages
  5  |  * Documentation: docs/qa/TEST_CASES.md (TC-PUB-001, TC-PUB-002, TC-PUB-003, TC-PUB-004)
  6  |  */
  7  | test.describe('Public & Marketing Pages', () => {
  8  | 
  9  |   /**
  10 |    * TC-PUB-001: Landing Page Yüklenmesi, Buton Etkileşimi ve Yönlendirme Kontrolü
  11 |    * Neyi/Niye Test Ediyoruz: Ana sayfanın hero bölümündeki CTA butonunun ("Ücretsiz Deneyin" / "Try for Free") tıklanabilirliğini ve /pricing sayfasına yönlendirme yaptığını test eder.
  12 |    */
  13 |   test('TC-PUB-001: Landing page renders hero CTA buttons and handles navigation on click', async ({ page }) => {
  14 |     await page.goto('/');
  15 | 
  16 |     // Locate primary CTA button
  17 |     const primaryCtaBtn = page.locator('button:has-text("Ücretsiz Deneyin"), button:has-text("Try for Free")').first();
  18 |     await expect(primaryCtaBtn).toBeVisible({ timeout: 10000 });
  19 | 
  20 |     // Click CTA button and verify page redirects to /pricing
  21 |     await primaryCtaBtn.click();
  22 |     await expect(page).toHaveURL(/\/pricing/);
  23 |   });
  24 | 
  25 |   /**
  26 |    * TC-PUB-002: Fiyatlandırma (Pricing) Sayfası Paket Kartları
  27 |    * Neyi/Niye Test Ediyoruz: Fiyatlandırma sayfasında paket içeriklerinin ve faturalandırma dönemi sekmelerinin çalıştığını doğrular.
  28 |    */
  29 |   test('TC-PUB-002: Pricing page displays plan cards and handles cycle toggle', async ({ page }) => {
  30 |     await page.goto('/pricing');
  31 |     await expect(page).toHaveURL(/\/pricing/);
  32 | 
  33 |     // Verify main pricing heading
  34 |     const mainHeading = page.locator('h1, h2').first();
  35 |     await expect(mainHeading).toBeVisible({ timeout: 10000 });
  36 | 
  37 |     // Verify plan action buttons exist on pricing page
  38 |     const planButtons = page.locator('main button');
  39 |     await expect(planButtons.first()).toBeVisible({ timeout: 10000 });
  40 |   });
  41 | 
  42 |   /**
  43 |    * TC-PUB-003: Özellikler (Features) Sayfası Erişilebilirliği
  44 |    * Neyi/Niye Test Ediyoruz: Özellikler sayfasının içerik başlıklarını ve modül kartlarını yüklediğini doğrular.
  45 |    */
  46 |   test('TC-PUB-003: Features page loads module overview cards', async ({ page }) => {
> 47 |     await page.goto('/features');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/features
  48 |     await expect(page).toHaveURL(/\/features/);
  49 | 
  50 |     const featureHeading = page.locator('h1, h2').first();
  51 |     await expect(featureHeading).toBeVisible({ timeout: 10000 });
  52 |   });
  53 | 
  54 |   /**
  55 |    * TC-PUB-004: Yasal Dokümanlar (Privacy & Terms) Başlık ve Metin Kontrolü
  56 |    * Neyi/Niye Test Ediyoruz: Yasal sayfaların başlık metinlerinin ve içeriklerinin tam yüklendiğini kontrol eder.
  57 |    */
  58 |   test('TC-PUB-004: Legal pages (Privacy & Terms) display complete policy titles', async ({ page }) => {
  59 |     await page.goto('/legal/privacy');
  60 |     await expect(page).toHaveURL(/\/legal\/privacy/);
  61 |     const privacyTitle = page.locator('h1, h2').first();
  62 |     await expect(privacyTitle).toBeVisible({ timeout: 10000 });
  63 | 
  64 |     await page.goto('/legal/terms');
  65 |     await expect(page).toHaveURL(/\/legal\/terms/);
  66 |     const termsTitle = page.locator('h1, h2').first();
  67 |     await expect(termsTitle).toBeVisible({ timeout: 10000 });
  68 |   });
  69 | 
  70 | });
  71 | 
```