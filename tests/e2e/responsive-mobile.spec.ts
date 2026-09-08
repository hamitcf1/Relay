import { test, expect } from '@playwright/test';

/**
 * Suite: Responsive & Mobile Layout
 * Documentation: docs/qa/TEST_CASES.md (TC-DASH-001)
 */
test.describe('Responsive Mobile Experience', () => {

  /**
   * TC-DASH-001: Mobil Uyumluluk Kontrolü
   * Neyi/Niye Test Ediyoruz: Mobil tarayıcı çözünürlüğünde sayfanın yatay kaydırma yapmadan duyarlı render edildiğini kontrol eder.
   */
  test('TC-DASH-001: Mobile viewport renders layout cleanly without horizontal scroll', async ({ page }) => {
    await page.goto('/');

    // Evaluate viewport width vs scroll width
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(isOverflowing).toBe(false);
  });

  test('mobile dashboard exposes quick actions and searchable all tabs', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile navigation is hidden at desktop breakpoints');
    await page.goto('/live-demo');
    await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 });

    await expect(page.getByRole('button', { name: /Quick action|Hızlı kayıt/i })).toBeVisible();
    await page.getByRole('button', { name: /Quick action|Hızlı kayıt/i }).click();
    await expect(page.getByRole('dialog', { name: /Quick action|Hızlı kayıt/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Quick action|Hızlı kayıt/i })).toBeHidden();
    await page.getByRole('button', { name: /^(All|Tümü)$/i }).click();
    await expect(page.getByRole('heading', { name: /All tabs|Tüm sekmeler/i })).toBeVisible();

    await page.getByPlaceholder(/Search tabs|Sekme ara/i).fill('Takvim');
    await page.getByRole('button', { name: /Takvim|Calendar/i }).click();
    await expect(page.getByRole('heading', { name: /All tabs|Tüm sekmeler/i })).toBeHidden();
  });

  test('weekly roster offers day employee and matrix views with a shift selector', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Roster mobile views are shown below the desktop breakpoint');
    await page.goto('/live-demo');
    await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 });
    await page.getByRole('button', { name: /Haftalık vardiya|Weekly roster/i }).click();

    const views = page.getByRole('tablist', { name: 'Roster view' });
    await expect(views.getByRole('tab')).toHaveCount(3);
    await views.getByRole('tab', { name: /Matris|Matrix/i }).click();
    await expect(views.getByRole('tab', { name: /Matris|Matrix/i })).toHaveAttribute('aria-selected', 'true');
    await views.getByRole('tab', { name: /Gün|Day/i }).click();
    await page.getByRole('button', { name: /Demo Manager/i }).last().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: /OFF/i })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: /Boş|Empty/i })).toBeVisible();
  });

});
