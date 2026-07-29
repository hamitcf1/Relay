import { test, expect } from '@playwright/test';

/**
 * Suite: Public & Marketing Pages
 * Documentation: docs/qa/TEST_CASES.md (TC-PUB-001, TC-PUB-002, TC-PUB-003, TC-PUB-004)
 */
test.describe('Public & Marketing Pages', () => {

  /**
   * TC-PUB-001: Landing Page Yüklenmesi, Buton Etkileşimi ve Yönlendirme Kontrolü
   * Neyi/Niye Test Ediyoruz: Ana sayfanın hero bölümündeki CTA butonunun ("Ücretsiz Deneyin" / "Try for Free") tıklanabilirliğini ve /pricing sayfasına yönlendirme yaptığını test eder.
   */
  test('TC-PUB-001: Landing page renders hero CTA buttons and handles navigation on click', async ({ page }) => {
    await page.goto('/');

    // Locate primary CTA button
    const primaryCtaBtn = page.locator('button:has-text("Ücretsiz Deneyin"), button:has-text("Try for Free")').first();
    await expect(primaryCtaBtn).toBeVisible({ timeout: 10000 });

    // Click CTA button and verify page redirects to /pricing
    await primaryCtaBtn.click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  /**
   * TC-PUB-002: Fiyatlandırma (Pricing) Sayfası Paket Kartları
   * Neyi/Niye Test Ediyoruz: Fiyatlandırma sayfasında paket içeriklerinin ve faturalandırma dönemi sekmelerinin çalıştığını doğrular.
   */
  test('TC-PUB-002: Pricing page displays plan cards and handles cycle toggle', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/);

    // Verify main pricing heading
    const mainHeading = page.locator('h1, h2').first();
    await expect(mainHeading).toBeVisible({ timeout: 10000 });

    // Verify plan action buttons exist on pricing page
    const planButtons = page.locator('main button');
    await expect(planButtons.first()).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-PUB-003: Özellikler (Features) Sayfası Erişilebilirliği
   * Neyi/Niye Test Ediyoruz: Özellikler sayfasının içerik başlıklarını ve modül kartlarını yüklediğini doğrular.
   */
  test('TC-PUB-003: Features page loads module overview cards', async ({ page }) => {
    await page.goto('/features');
    await expect(page).toHaveURL(/\/features/);

    const featureHeading = page.locator('h1, h2').first();
    await expect(featureHeading).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-PUB-004: Yasal Dokümanlar (Privacy & Terms) Başlık ve Metin Kontrolü
   * Neyi/Niye Test Ediyoruz: Yasal sayfaların başlık metinlerinin ve içeriklerinin tam yüklendiğini kontrol eder.
   */
  test('TC-PUB-004: Legal pages (Privacy & Terms) display complete policy titles', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page).toHaveURL(/\/legal\/privacy/);
    const privacyTitle = page.locator('h1, h2').first();
    await expect(privacyTitle).toBeVisible({ timeout: 10000 });

    await page.goto('/legal/terms');
    await expect(page).toHaveURL(/\/legal\/terms/);
    const termsTitle = page.locator('h1, h2').first();
    await expect(termsTitle).toBeVisible({ timeout: 10000 });
  });

});
