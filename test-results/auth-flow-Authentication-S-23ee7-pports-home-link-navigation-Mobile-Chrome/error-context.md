# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Authentication & Security >> TC-AUTH-001: Login form accepts input, toggles password visibility, and supports home link navigation
- Location: tests/e2e/auth-flow.spec.ts:13:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/login
Call log:
  - navigating to "http://localhost:5174/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Suite: Authentication & Security
  5  |  * Documentation: docs/qa/TEST_CASES.md (TC-AUTH-001, TC-AUTH-002)
  6  |  */
  7  | test.describe('Authentication & Security', () => {
  8  | 
  9  |   /**
  10 |    * TC-AUTH-001: Giriş Yap (Login) Formu Veri Girişi ve Şifre Gizleme/Göster Etkileşimi
  11 |    * Neyi/Niye Test Ediyoruz: Kullanıcının e-posta ve şifre girebildiğini, şifre göster/gizle butonunun input tipini değiştirdiğini ve anasayfaya dönme linkinin çalıştığını doğrular.
  12 |    */
  13 |   test('TC-AUTH-001: Login form accepts input, toggles password visibility, and supports home link navigation', async ({ page }) => {
> 14 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/login
  15 |     await expect(page).toHaveURL(/\/login/);
  16 | 
  17 |     // Wait for email input to be visible and interactable
  18 |     const emailInput = page.locator('#email');
  19 |     await expect(emailInput).toBeVisible({ timeout: 10000 });
  20 | 
  21 |     // Type email
  22 |     await emailInput.fill('reception@hotelrelay.com');
  23 |     await expect(emailInput).toHaveValue('reception@hotelrelay.com');
  24 | 
  25 |     // Type password
  26 |     const passwordInput = page.locator('#password');
  27 |     await expect(passwordInput).toBeVisible();
  28 |     await passwordInput.fill('SecurePass123!');
  29 |     await expect(passwordInput).toHaveValue('SecurePass123!');
  30 | 
  31 |     // Toggle password reveal button if present
  32 |     const togglePasswordBtn = page.locator('button[aria-label*="password" i], button:has(svg)').first();
  33 |     if (await togglePasswordBtn.isVisible()) {
  34 |       await togglePasswordBtn.click();
  35 |     }
  36 | 
  37 |     // Verify back to home link returns user to landing page
  38 |     const backToHomeLink = page.locator('a[href="/"]').first();
  39 |     await expect(backToHomeLink).toBeVisible();
  40 |     await backToHomeLink.click();
  41 |     await expect(page).toHaveURL('/');
  42 |   });
  43 | 
  44 |   /**
  45 |    * TC-AUTH-002: Korumalı Rota (Protected Route) Güvenlik Yönlendirmesi
  46 |    * Neyi/Niye Test Ediyoruz: Oturum açılmamışken /dashboard rotasına gidildiğinde sistemin yetkisiz erişimi engelleyip /login sayfasına yönlendirmesini doğrular.
  47 |    */
  48 |   test('TC-AUTH-002: Unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
  49 |     await page.goto('/dashboard');
  50 |     // Expect client side router redirect to /login
  51 |     await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  52 |   });
  53 | 
  54 | });
  55 | 
```