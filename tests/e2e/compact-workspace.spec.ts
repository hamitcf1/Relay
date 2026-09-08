import { expect, test } from '@playwright/test'

async function enterManagerDemo(page: import('@playwright/test').Page) {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 })
}

async function enterStaffDemo(page: import('@playwright/test').Page) {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: /Enter as Receptionist|Resepsiyonist/i }).click()
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
    const left = page.getByTestId('compact-shift-left')
    const right = page.getByTestId('compact-shift-right')
    await left.evaluate((element) => { element.scrollTop = 300 })
    expect(await left.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    expect(await right.evaluate((element) => element.scrollTop)).toBe(0)
  })

  test('shows the complete published roster to ordinary staff', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop staff visibility is covered here')
    await enterStaffDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
    await expect(page.getByTestId('compact-card-roster')).toBeVisible()
    await page.getByTestId('compact-desktop-nav').getByRole('button', { name: /Operasyon|Operations/i }).click()
    await expect(page.getByTestId('compact-operations').getByRole('button', { name: /Ayarlar|Settings/i })).toHaveCount(0)
  })

  test('switches workspace directly from the profile menu', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop profile shortcut is covered here')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /Demo Manager/i }).click()
    await page.getByRole('menuitem', { name: /Kompakt görünüme geç|Switch to Compact/i }).click()
    await expect(page.getByTestId('compact-workspace')).toBeVisible()
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

  test('opens the handover composer from the compact operations overview', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop overview action is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
    await page.getByTestId('compact-desktop-nav').getByRole('button', { name: /Operasyon|Operations/i }).click()

    await page.getByTestId('compact-operations').getByRole('button', { name: /Yeni kayıt|New record/i }).click()

    const notes = page.getByTestId('compact-card-notes')
    await expect(notes).toBeInViewport()
    await expect(notes.locator('textarea').last()).toBeVisible()
  })

  test('does not open real-time Firebase subscriptions in the demo workspace', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'The shared demo subscription path is covered once')
    const permissionErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && /permission|insufficient/i.test(message.text())) permissionErrors.push(message.text())
    })
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
    await page.getByTestId('compact-desktop-nav').getByRole('button', { name: /Operasyon|Operations/i }).click()
    const operations = page.getByTestId('compact-operations')
    const moduleButtons = operations.locator('aside button[title]')
    for (let index = 0; index < await moduleButtons.count(); index++) {
      await moduleButtons.nth(index).click()
      await page.waitForTimeout(150)
    }
    await page.waitForTimeout(300)
    expect(permissionErrors).toEqual([])
  })

  test('creates a handover note locally in demo mode', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop demo write boundary is covered here')
    const permissionErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && /permission|insufficient/i.test(message.text())) permissionErrors.push(message.text())
    })
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
    const notes = page.getByTestId('compact-card-notes')
    await notes.getByRole('button', { name: /Devir kaydı ekle|Add handover/i }).click()
    await notes.locator('textarea').last().fill('Demo boundary note')
    await notes.getByRole('button', { name: /Kaydet|Save/i }).click()

    await expect(notes.getByRole('paragraph').filter({ hasText: 'Demo boundary note' })).toBeVisible()
    expect(permissionErrors).toEqual([])
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
    await page.getByTestId('compact-desktop-nav').getByRole('button', { name: /Vardiya|Shift/i }).click()

    await expect(page.getByTestId('compact-shift-left').getByTestId('compact-card-calendar')).toBeVisible()
    await expect(page.getByTestId('compact-shift-right').getByTestId('compact-card-calendar')).toHaveCount(0)
  })

  test('keeps an unfinished handover note when a mode switch is cancelled', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop mode switch guard is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
    const notes = page.getByTestId('compact-card-notes')
    await notes.getByRole('button', { name: /Devir kaydı ekle|Add handover/i }).click()
    const draft = notes.locator('textarea').last()
    await draft.fill('Do not lose this handover draft')

    await page.getByTestId('compact-desktop-nav').getByRole('button', { name: /Demo M/i }).click()
    await page.getByText(/Appearance|Görünüm/i).last().hover()
    await page.getByRole('button', { name: /Modern/i }).click()
    const warning = page.getByRole('alertdialog')
    await expect(warning).toBeVisible()
    await warning.getByRole('button', { name: /Kal ve düzenlemeye devam et|Stay and continue editing/i }).click()

    await expect(page.getByTestId('compact-workspace')).toBeVisible()
    await expect(draft).toHaveValue('Do not lose this handover draft')

    await page.getByRole('menuitem', { name: /Modern görünüme geç|Switch to Modern/i }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: /Değişiklikleri sil ve geç|Discard changes and switch/i }).click()
    await expect(page.getByTestId('compact-workspace')).toHaveCount(0)
  })

  test('starts mobile shift with only handover expanded', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile accordion behavior is covered here')
    await enterManagerDemo(page)
    await expect(page.getByRole('button', { name: /Profil|Profile/i })).toBeVisible()
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))

    await expect(page.getByTestId('compact-card-notes').getByRole('button').first()).toHaveAttribute('aria-expanded', 'true')
    const rosterToggle = page.getByTestId('compact-card-roster').getByRole('button').first()
    await expect(rosterToggle).toHaveAttribute('aria-expanded', 'false')
    await rosterToggle.click()
    await expect(rosterToggle).toHaveAttribute('aria-expanded', 'true')
    const mobileNav = page.getByTestId('compact-mobile-nav')
    await mobileNav.getByRole('button', { name: /Operasyon|Operations/i }).click()
    await mobileNav.getByRole('button', { name: /Vardiya|Shift/i }).click()
    await expect(page.getByTestId('compact-card-roster').getByRole('button').first()).toHaveAttribute('aria-expanded', 'true')
  })

  test('chooses a single operations module from the mobile sheet', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile operations selector is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact' }))
    await page.getByTestId('compact-mobile-nav').getByRole('button', { name: /Operasyon|Operations/i }).click()

    const operations = page.getByTestId('compact-operations')
    await operations.getByRole('button', { name: /Operasyon özeti|Operations overview/i }).click()
    const selector = page.getByRole('dialog')
    await expect(selector).toBeVisible()
    await selector.getByRole('button', { name: /Mesajlar|Messages/i }).click()
    await expect(selector).toHaveCount(0)
    await expect(operations.getByRole('button', { name: /Mesajlar|Messages/i })).toBeVisible()
  })

  test('expands a compact mobile shift card from a direct module link', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile deep-link expansion is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact', compact_collapsed_mobile: { roster: true } }))
    await page.evaluate(() => {
      window.history.pushState({}, '', '/dashboard?tab=roster')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    const rosterToggle = page.getByTestId('compact-card-roster').getByRole('button').first()
    await expect(rosterToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('compact-card-roster')).toBeInViewport()
  })

  test('maps an old operations roster link back to the compact shift card', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile direct-link routing is covered here')
    await enterManagerDemo(page)
    await page.evaluate(() => (window as any).useAuthStore.getState().updateSettings({ workspace_mode: 'compact', compact_collapsed_mobile: { roster: true } }))
    await page.evaluate(() => {
      window.history.pushState({}, '', '/operations?tab=roster')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    const roster = page.getByTestId('compact-card-roster')
    await expect(roster.getByRole('button').first()).toHaveAttribute('aria-expanded', 'true')
    await expect(roster).toBeInViewport()
  })
})
