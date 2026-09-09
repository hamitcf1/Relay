import { expect, test, type Page } from '@playwright/test'

async function enterManagerDemo(page: Page) {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: /Enter as Manager|Yönetici/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  await page.locator('div.fixed.inset-0 button').first().click({ timeout: 15000 })
}

test.describe('Operations UX fixes', () => {
  test('shows workspace mode once and keeps Appearance inside the viewport', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop profile menu is covered here')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /Demo Manager/i }).click()

    await expect(page.getByRole('menuitem', { name: /Kompakt görünüme geç|Switch to Compact/i })).toHaveCount(0)
    await page.getByRole('menuitem', { name: /^Görünüm|^Appearance/i }).click()

    const dialog = page.getByRole('dialog', { name: /^Görünüm|^Appearance/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('workspace-mode-options')).toHaveCount(1)
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  })

  test('removes redundant overview return bars and bounds module scrolling', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop module surface is covered here')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /Haftalık vardiya|Weekly roster/i }).click()

    await expect(page.getByText(/Operasyon özetine dön|Back to operations/i)).toHaveCount(0)
    const surface = page.getByTestId('modern-module-surface')
    await expect(surface).toBeVisible()
    await expect(surface).toHaveCSS('overflow-y', 'auto')
    expect((await surface.boundingBox())!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  })

  test('renders legacy activity actions without crashing', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop activity module is covered here')
    const { humanizeActivityAction } = await import('../../src/lib/activity')
    expect(humanizeActivityAction('legacy_clock_event')).toBe('legacy clock event')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /Aktivite|Activity/i }).click()
    await expect(page.getByTestId('modern-module-surface')).toBeVisible()
    await expect(page.getByTestId('modern-module-surface').getByText(/Aktivite|Activity/i).first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Cannot read properties of undefined')
  })

  test('previews mobile navigation without overlapping labels', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop settings editor contains the preview')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /^Ayarlar$|^Settings$/i }).click()
    await page.getByRole('tab', { name: /Navigasyon|Navigation/i }).click()

    const preview = page.getByTestId('navigation-mobile-preview')
    await expect(preview).toBeVisible()
    const overlaps = await preview.locator('[data-preview-item]').evaluateAll((items) => items.some((item, index) => {
      const next = items[index + 1]
      return next ? item.getBoundingClientRect().right > next.getBoundingClientRect().left : false
    }))
    expect(overlaps).toBe(false)
  })

  test('creates a targeted full-screen announcement with a visible audience', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Desktop announcement composer is covered here')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /Mesajlar|Messages/i }).click()
    await page.getByRole('button', { name: /Duyuru oluştur|Create announcement/i }).click()

    const dialog = page.getByRole('dialog', { name: /Duyuru oluştur|Create announcement/i })
    await expect(dialog).toBeVisible()
    expect((await dialog.boundingBox())!.width).toBeGreaterThan(page.viewportSize()!.width * 0.85)
    await dialog.getByRole('button', { name: /Seçili kişiler|Selected people/i }).click()
    await dialog.getByRole('checkbox', { name: /Demo Staff/i }).check()
    await dialog.getByLabel(/Duyuru başlığı|Announcement title/i).fill('Gece vardiyası bilgisi')
    await dialog.getByLabel(/Duyuru metni|Announcement message/i).fill('Lütfen yeni prosedürü okuyun.')
    await dialog.getByRole('button', { name: /Duyuruyu gönder|Send announcement/i }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText(/1 kişi|1 person/i)).toBeVisible()
    await expect(page.getByTestId('modern-module-surface').getByText('Gece vardiyası bilgisi')).toBeVisible()
  })

  test('keeps the announcement composer usable on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile announcement layout is covered here')
    await enterManagerDemo(page)
    await page.getByRole('button', { name: /^(Tümü|All)$/i }).click()
    const directory = page.getByRole('dialog', { name: /Tüm sekmeler|All tabs/i })
    await directory.getByRole('button', { name: /Mesajlar|Messages/i }).click()
    await page.getByRole('button', { name: /Duyuru oluştur|Create announcement/i }).click()

    const dialog = page.getByRole('dialog', { name: /Duyuru oluştur|Create announcement/i })
    await expect(dialog).toBeVisible()
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    await expect(dialog.getByLabel(/Duyuru başlığı|Announcement title/i)).toBeVisible()
    await expect(dialog.getByLabel(/Duyuru metni|Announcement message/i)).toBeVisible()
  })
})
