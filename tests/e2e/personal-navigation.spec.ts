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

test('unstarring every tab empties the top block instead of falling back to the admin layout', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), 'Desktop sidebar flow')
  await enterDemo(page)
  const sidebar = page.getByRole('navigation', { name: 'Primary navigation' })
  const starred = sidebar.locator('div.space-y-1').first()
  await expect(starred.locator('button')).not.toHaveCount(0)

  await sidebar.getByRole('button', { name: 'Yan panelimi düzenle' }).click()
  const editor = page.getByRole('dialog', { name: 'Yan panelimi düzenle' })
  await expect(editor).toBeVisible()
  for (let star = await editor.locator('button[aria-pressed="true"]').count(); star > 0; star--) {
    await editor.locator('button[aria-pressed="true"]').first().click()
  }
  await editor.getByRole('button', { name: 'Kaydet' }).click()
  await expect(editor).toBeHidden()

  await expect(starred.locator('button')).toHaveCount(0)
  await sidebar.getByRole('button', { name: 'Kişisel notlar' }).click()
  await expect(page.getByRole('heading', { name: 'Kişisel notlar' })).toBeVisible()
})

test('an admin renames a tab without disturbing the account layout', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), 'Desktop navigation flow')
  await enterDemo(page)
  const sidebar = page.getByRole('navigation', { name: 'Primary navigation' })

  // The account strips its own top block first.
  await sidebar.getByRole('button', { name: 'Yan panelimi düzenle' }).click()
  const editor = page.getByRole('dialog', { name: 'Yan panelimi düzenle' })
  await expect(editor).toBeVisible()
  for (let star = await editor.locator('button[aria-pressed="true"]').count(); star > 0; star--) {
    await editor.locator('button[aria-pressed="true"]').first().click()
  }
  await editor.getByRole('button', { name: 'Kaydet' }).click()
  await expect(editor).toBeHidden()
  const starred = sidebar.locator('div.space-y-1').first()
  await expect(starred.locator('button')).toHaveCount(0)

  // An admin renames the tab and publishes hotel-wide.
  await sidebar.getByRole('button', { name: /^Ayarlar$/ }).click()
  await page.getByRole('tab', { name: /Navigasyon|Navigation/i }).click()
  const navigation = page.getByTestId('navigation-editor')
  await expect(navigation).toBeVisible()
  await navigation.getByLabel('Kişisel notlar Görünen ad').fill('Notlar')
  const publish = navigation.getByRole('button', { name: /Herkes için yayınla|Publish for everyone/i })
  await publish.click()
  // The publish button only disables once the draft is stored hotel-wide.
  await expect(publish).toBeDisabled()

  // The rename reaches the sidebar, and the personal layout is untouched.
  await sidebar.getByRole('button', { name: 'Notlar' }).click()
  await expect(page.getByRole('heading', { name: 'Kişisel notlar' })).toBeVisible()
  await expect(starred.locator('button')).toHaveCount(0)
  await expect(sidebar.getByRole('button', { name: 'Kişisel notlar' })).toHaveCount(0)
})
