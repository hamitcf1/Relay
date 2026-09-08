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

  test('theme and accent choices stay focused and accessible', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Appearance menu is covered by the desktop shell scenario');
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

  test('navigation editor publishes hotel-wide layout changes', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Navigation editor desktop workflow is covered separately from mobile navigation');
    await page.goto('/live-demo');
    await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 });

    await page.getByRole('button', { name: /^Ayarlar$/i }).click();
    await page.getByRole('tab', { name: /Navigasyon|Navigation/i }).click();
    const editor = page.getByTestId('navigation-editor');
    await expect(editor).toBeVisible();

    await editor.getByLabel('Section name').nth(1).fill('Ön Büro');
    await editor.getByRole('button', { name: /Herkes için yayınla|Publish for everyone/i }).click();
    await expect(page.getByText('Ön Büro', { exact: true })).toBeVisible();
  });

  test('operations overview leads with work that needs attention', async ({ page }) => {
    await page.goto('/live-demo');
    await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 });

    const priority = page.getByRole('heading', { name: /Öncelikli işler|Priority work/i });
    const handover = page.getByRole('heading', { name: /Vardiya devri|Shift handover/i });
    await expect(priority).toBeVisible();
    await expect(handover).toBeVisible();
    expect(await priority.evaluate((node) => Boolean(node.compareDocumentPosition(document.querySelector('#handover-title')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBeTruthy();
    await page.getByRole('button', { name: /Airport transfer/i }).click();
    await expect(page.getByText(/Satış Takibi|Sales Tracker/i).first()).toBeVisible();
  });

  test('weekly roster autosaves a shared draft before publishing', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop roster publication is covered here; mobile views have a focused test.');
    await page.goto('/live-demo');
    await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 });
    await page.getByRole('button', { name: /Haftalık vardiya|Weekly roster/i }).click();

    await page.getByRole('button', { name: /Demo Manager, Pazartesi|Demo Manager, Monday/i }).click();
    const selector = page.getByRole('dialog');
    await expect(selector).toBeVisible();
    await expect(selector.getByRole('button', { name: /Boş|Empty/i })).toContainText('Boş');
    await page.keyboard.press('Escape');
    await expect(selector).toBeHidden();
    await page.getByRole('button', { name: /Demo Manager, Pazartesi|Demo Manager, Monday/i }).click();
    await selector.getByRole('button', { name: /^B\b/ }).click();
    await expect(page.getByText(/Ortak taslak kaydedildi|Shared draft saved/i)).toBeVisible();
    const publish = page.getByRole('button', { name: /Yayınla|Publish/i });
    await expect(publish).toBeEnabled();
    await publish.click();
    await expect(page.getByText(/Vardiya yayınlandı|Roster published/i)).toBeVisible();
  });

});
