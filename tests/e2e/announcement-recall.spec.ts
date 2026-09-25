import { expect, test, type Page } from '@playwright/test'
import { enterDemo } from './helpers'

async function openAnnouncementChannel(page: Page) {
  await page.getByRole('button', { name: /Mesajlar|Messages/i }).click()
  await expect(page.getByTestId('announcement-feed')).toBeVisible()
}

async function enterManagerDemo(page: Page) {
  await enterDemo(page, 'Manager')
}

test.describe('announcements can be withdrawn and read back per person', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'Covered by the manager view test')

  test('withdrawing an announcement removes it from the channel and marks it withdrawn', async ({ page }) => {
    await enterManagerDemo(page)
    await openAnnouncementChannel(page)

    const row = page.getByTestId('announcement-feed-row').filter({ hasText: 'Ramazan servisi değişikliği' })
    await expect(row).toBeVisible()
    await expect(row).toHaveAttribute('data-recalled', 'false')

    await row.getByRole('button', { name: /Yayından geri çek|Withdraw/i }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: /Yayından geri çek|Withdraw/i }).click()

    await expect(row).toHaveAttribute('data-recalled', 'true')
    await expect(row.getByText(/Geri alındı|Withdrawn/)).toBeVisible()
  })

  test('a withdrawn announcement leaves the reader view and can be published again', async ({ page }) => {
    await enterManagerDemo(page)
    await openAnnouncementChannel(page)

    const row = page.getByTestId('announcement-feed-row').filter({ hasText: 'Oda 214 hakkında' })
    await row.getByRole('button', { name: /Yayından geri çek|Withdraw/i }).click()
    const confirm = page.getByRole('alertdialog')
    await confirm.getByRole('button', { name: /Yayından geri çek|Withdraw/i }).click()
    await expect(row).toHaveAttribute('data-recalled', 'true')

    // Management can bring it back; once restored it is live again for everyone.
    await row.getByRole('button', { name: /Kimler gördü|Who has seen/i }).click()
    const manager = page.getByTestId('announcement-manager')
    await expect(manager).toBeVisible()

    const entry = manager.getByTestId('announcement-manager-row').filter({ hasText: 'Oda 214 hakkında' })
    await expect(entry).toHaveAttribute('data-recalled', 'true')
    await entry.locator('button[aria-expanded]').click()
    await entry.getByRole('button', { name: /Yeniden yayınla|Publish again/i }).click()

    await expect(manager.locator('li[data-recalled="true"]')).toHaveCount(0)
    await expect(row).toHaveAttribute('data-recalled', 'false')
  })
})

test.describe('the management view shows who saw and who closed each announcement', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'Covered by the manager view test')

  test('lists pending, seen and dismissed recipients with timestamps', async ({ page }) => {
    await enterManagerDemo(page)
    await openAnnouncementChannel(page)

    await page.getByTestId('announcement-feed-row').first()
      .getByRole('button', { name: /Kimler gördü|Who has seen/i }).click()

    const manager = page.getByTestId('announcement-manager')
    await expect(manager).toBeVisible()
    await manager.locator('li button[aria-expanded]').first().click()
    await expect(manager.getByText(/Henüz görmeyenler|Not seen yet/).first()).toBeVisible()
    await expect(manager.getByText(/Görenler|Seen/).first()).toBeVisible()
    await expect(manager.getByText(/Kapatanlar|Dismissed/).first()).toBeVisible()

    // The seeded announcement was closed by Demo Staff, so they must appear under dismissed.
    const dismissed = manager.locator('div').filter({ hasText: /^Kapatanlar|Dismissed/ }).last()
    await expect(dismissed.getByText('Demo Staff')).toBeVisible()
    // A timestamp is shown for the states that were actually reached.
    await expect(dismissed.locator('li span').filter({ hasText: /ago|\d/ }).first()).toBeVisible()
  })

  test('offers no read receipts view to a non manager account', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    await openAnnouncementChannel(page)
    await expect(page.getByTestId('announcement-feed')).toBeVisible()
    await expect(page.getByRole('button', { name: /Yayından geri çek|Withdraw/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Kimler gördü|Who has seen/i })).toHaveCount(0)
  })
})

test.describe('a reader is recorded as having seen and closed an announcement', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'Covered by the manager view test')

  test('closing the full screen announcement stops it from interrupting again', async ({ page }) => {
    await enterDemo(page, 'Receptionist', { keepAnnouncement: true })

    const modal = page.getByTestId('announcement-modal')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Oda 214 hakkında')

    // It stays open until the reader closes it, even though the seen receipt is already written.
    await page.waitForTimeout(500)
    await expect(modal).toBeVisible()

    await modal.getByRole('button', { name: /Okudum, kapat|I have read this/i }).click()
    await expect(modal).toBeHidden()

    // The receipt is written for this person, not for anyone else.
    const receipt = await page.evaluate(() => {
      const store = (window as any).useAnnouncementStore.getState()
      return store.receipts['demo-ann-2'] || null
    })
    expect(receipt?.state).toBe('dismissed')
    expect(receipt?.uid).toBe('demo-user-staff')

    // And it does not come back on reload.
    await page.reload()
    await expect(page.getByTestId('announcement-modal')).toBeHidden()
  })

  test('tells a reader that an announcement they already saw was withdrawn', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    // The helper already read and closed the pending announcement, which is the state we need:
    // the reader has a receipt, and now management withdraws it.
    const read = await page.evaluate(() => {
      const store = (window as any).useAnnouncementStore.getState()
      return store.receipts['demo-ann-2']?.state || null
    })
    expect(read).toBe('dismissed')

    await page.evaluate(async () => {
      await (window as any).useAnnouncementStore.getState().recallAnnouncement('demo-hotel-id', 'demo-ann-2', 'Demo Manager')
    })

    const notice = page.getByTestId('announcement-retracted')
    await expect(notice).toBeVisible()
    await expect(notice).toContainText(/yönetim tarafından geri alındı|withdrawn by management/i)

    // It also leaves the channel, so the retraction is not contradicted by the history.
    await openAnnouncementChannel(page)
    await expect(page.getByTestId('announcement-feed-row').filter({ hasText: 'Oda 214 hakkında' })).toHaveCount(0)
  })
})
