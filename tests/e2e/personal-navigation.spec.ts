import { expect, test } from '@playwright/test'

async function enterDemo(page: import('@playwright/test').Page) {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 })
}

test('personal notes are a directly accessible module and sidebar order is personal', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), 'Desktop sidebar flow')
  await enterDemo(page)
  const sidebar = page.getByRole('navigation', { name: 'Primary navigation' })
  await sidebar.getByRole('button', { name: 'Kişisel notlar' }).click()
  await expect(page.getByRole('heading', { name: 'Kişisel notlar' })).toBeVisible()

  await sidebar.getByRole('button', { name: 'Yan panelimi düzenle' }).click()
  const editor = page.getByRole('dialog', { name: 'Yan panelimi düzenle' })
  await expect(editor).toBeVisible()
  await editor.getByRole('button', { name: 'Yıldızla: Kişisel notlar' }).click()
  await editor.getByRole('button', { name: 'Kaydet' }).click()
  await expect(editor).toBeHidden()
  await expect.poll(async () => page.evaluate(() => (window as any).useAuthStore.getState().user.settings.sidebar_preferences.favorite_ids)).not.toContain('personal-notes')
})

test('compact shift shows personal notes card', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), 'Desktop compact card')
  await enterDemo(page)
  await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
  await expect(page.getByTestId('compact-card-personal-notes')).toBeVisible()
})
