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

});
