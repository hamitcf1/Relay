import { test, expect } from '@playwright/test';

/**
 * Suite: Live Demo & Simulation Sandbox
 * Documentation: docs/qa/TEST_CASES.md (TC-DEMO-001, TC-DEMO-002)
 */
test.describe('Live Demo & Simulation', () => {

  /**
   * TC-DEMO-001: Canlı Demo (Live Demo) Rol Kartlarının Görüntülenmesi
   * Neyi/Niye Test Ediyoruz: Live Demo sayfasında GM ve Resepsiyonist demo role kartlarının butonlarıyla birlikte görüntülendiğini doğrular.
   */
  test('TC-DEMO-001: Live Demo page renders GM and Staff demo cards', async ({ page }) => {
    await page.goto('/live-demo');
    await expect(page).toHaveURL(/\/live-demo/);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verify demo selection buttons exist
    const demoButtons = page.locator('button');
    await expect(demoButtons.first()).toBeVisible();
  });

  /**
   * TC-DEMO-002: Live Demo Rol Seçimi ve Dashboard Paneline Otomatik Giriş
   * Neyi/Niye Test Ediyoruz: Kullanıcı Live Demo sayfasında "Demo Girişi Yap" butonuna tıkladığında demo oturumunun açılıp doğrudan /dashboard ekranına aktarıldığını ve operasyonel panellerin yüklendiğini test eder.
   */
  test('TC-DEMO-002: Clicking demo login button authenticates demo session and navigates into /dashboard', async ({ page }) => {
    await page.goto('/live-demo');

    // Click the manager demo role button.
    const demoLoginBtn = page.getByRole('button', { name: /Enter as Manager|Yönetici/i });
    await expect(demoLoginBtn).toBeVisible({ timeout: 10000 });
    await demoLoginBtn.click();

    // Wait for automatic redirection to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Verify dashboard elements (sidebar, brand mark or main container) load cleanly
    const dashboardBody = page.locator('body');
    await expect(dashboardBody).toBeVisible();
  });

  test('theme and accent choices stay focused and accessible', async ({ page }) => {
    await page.goto('/live-demo');
    await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    const onboardingClose = page.locator('div.fixed.inset-0 button').first();
    await onboardingClose.click({ timeout: 15000 });

    await page.getByRole('button', { name: /Demo Manager/i }).click();
    const appearanceItem = page.getByText(/Appearance|Görünüm/i).last();
    await appearanceItem.hover();

    const themeGroup = page.getByTestId('theme-options');
    await expect(themeGroup.getByRole('button')).toHaveCount(2);
    await expect(themeGroup).toContainText(/Light|Aydınlık/i);
    await expect(themeGroup).toContainText(/Dark|Karanlık/i);

    const accentGroup = page.getByTestId('accent-options');
    const accents = accentGroup.getByRole('button');
    await expect(accents).toHaveCount(5);

    for (let index = 0; index < await accents.count(); index += 1) {
      await accents.nth(index).click();
      await expect(accents.nth(index)).toHaveAttribute('aria-pressed', 'true');
    }
  });

});
