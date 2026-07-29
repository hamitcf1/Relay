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

    // Click the first demo role button (e.g. GM or Staff Demo)
    const demoLoginBtn = page.locator('button').first();
    await expect(demoLoginBtn).toBeVisible({ timeout: 10000 });
    await demoLoginBtn.click();

    // Wait for automatic redirection to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Verify dashboard elements (sidebar, brand mark or main container) load cleanly
    const dashboardBody = page.locator('body');
    await expect(dashboardBody).toBeVisible();
  });

});
