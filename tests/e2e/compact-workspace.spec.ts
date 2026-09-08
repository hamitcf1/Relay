import { expect, test } from '@playwright/test'

async function enterManagerDemo(page: import('@playwright/test').Page) {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 })
}

test.describe('Compact workspace', () => {
  test('switches from modern to embedded desktop shift modules', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop compact columns are covered here')
    await enterManagerDemo(page)

    await page.getByRole('button', { name: /Demo Manager/i }).click()
    await page.getByText(/Appearance|Görünüm/i).last().hover()
    await page.getByRole('button', { name: /Compact|Kompakt/i }).click()

    await expect(page.getByTestId('compact-workspace')).toBeVisible()
    await expect(page.getByTestId('compact-card-notes')).toBeVisible()
    await expect(page.getByTestId('compact-card-roster')).toBeVisible()
    await expect(page.getByTestId('compact-card-hotel-info')).toBeVisible()
    await expect(page.getByTestId('compact-shift-left')).toHaveCSS('overflow-y', 'auto')
    await expect(page.getByTestId('compact-shift-right')).toHaveCSS('overflow-y', 'auto')
  })

  test('uses a focused operations workspace with overview first', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop operations rail is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))

    const compactNav = page.getByTestId('compact-desktop-nav')
    await expect(compactNav.getByRole('button', { name: /Vardiya|Shift/i })).toBeVisible()
    await compactNav.getByRole('button', { name: /Operasyon|Operations/i }).click()

    const operations = page.getByTestId('compact-operations')
    await expect(operations.getByRole('button', { name: /Operasyon özeti|Operations overview/i })).toHaveAttribute('aria-current', 'page')
    await expect(operations.getByRole('heading', { name: /Bugün neye müdahale gerekiyor|What needs attention today/i })).toBeVisible()
    await operations.getByRole('button', { name: /Mesajlar|Messages/i }).click()
    await expect(operations.getByRole('button', { name: /Mesajlar|Messages/i })).toHaveAttribute('aria-current', 'page')
  })

  test('publishes the administrator compact column layout', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop navigation editor workflow is covered here')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /^Ayarlar$|^Settings$/i }).click()
    await page.getByRole('tab', { name: /Navigasyon|Navigation/i }).click()

    const editor = page.getByTestId('compact-layout-editor')
    await expect(editor).toBeVisible()
    await editor.getByRole('button', { name: /Takvim.*sol sütuna taşı|Move Calendar.*left column/i }).click()
    await page.getByRole('button', { name: /Herkes için yayınla|Publish for everyone/i }).click()
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))

    await expect(page.getByTestId('compact-shift-left').getByTestId('compact-card-calendar')).toBeVisible()
    await expect(page.getByTestId('compact-shift-right').getByTestId('compact-card-calendar')).toHaveCount(0)
  })

  test('starts mobile shift with only handover expanded', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile accordion behavior is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))

    await expect(page.getByTestId('compact-card-notes').getByRole('button').first()).toHaveAttribute('aria-expanded', 'true')
    const rosterToggle = page.getByTestId('compact-card-roster').getByRole('button').first()
    await expect(rosterToggle).toHaveAttribute('aria-expanded', 'false')
    await rosterToggle.click()
    await expect(rosterToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('compact-mobile-nav').getByRole('button', { name: /Operasyon|Operations/i })).toBeVisible()
  })
})
