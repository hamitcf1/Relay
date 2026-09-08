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
})
