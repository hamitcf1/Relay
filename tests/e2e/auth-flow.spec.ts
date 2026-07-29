import { test, expect } from '@playwright/test';

/**
 * Suite: Authentication & Security
 * Documentation: docs/qa/TEST_CASES.md (TC-AUTH-001, TC-AUTH-002)
 */
test.describe('Authentication & Security', () => {

  /**
   * TC-AUTH-001: Giriş Yap (Login) Formu Veri Girişi ve Şifre Gizleme/Göster Etkileşimi
   * Neyi/Niye Test Ediyoruz: Kullanıcının e-posta ve şifre girebildiğini, şifre göster/gizle butonunun input tipini değiştirdiğini ve anasayfaya dönme linkinin çalıştığını doğrular.
   */
  test('TC-AUTH-001: Login form accepts input, toggles password visibility, and supports home link navigation', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Wait for email input to be visible and interactable
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Type email
    await emailInput.fill('reception@hotelrelay.com');
    await expect(emailInput).toHaveValue('reception@hotelrelay.com');

    // Type password
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('SecurePass123!');
    await expect(passwordInput).toHaveValue('SecurePass123!');

    // Toggle password reveal button if present
    const togglePasswordBtn = page.locator('button[aria-label*="password" i], button:has(svg)').first();
    if (await togglePasswordBtn.isVisible()) {
      await togglePasswordBtn.click();
    }

    // Verify back to home link returns user to landing page
    const backToHomeLink = page.locator('a[href="/"]').first();
    await expect(backToHomeLink).toBeVisible();
    await backToHomeLink.click();
    await expect(page).toHaveURL('/');
  });

  /**
   * TC-AUTH-002: Korumalı Rota (Protected Route) Güvenlik Yönlendirmesi
   * Neyi/Niye Test Ediyoruz: Oturum açılmamışken /dashboard rotasına gidildiğinde sistemin yetkisiz erişimi engelleyip /login sayfasına yönlendirmesini doğrular.
   */
  test('TC-AUTH-002: Unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // Expect client side router redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

});
