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

    // A withdrawal is told as a correction, not as content: repeating the original text would
    // invite the reader to act on the copy that is no longer valid.
    const modal = page.getByTestId('announcement-modal')
    await expect(modal).toBeVisible()
    await expect(modal).toHaveAttribute('data-retraction', 'true')
    await expect(modal).toContainText(/artık geçerli değil|no longer applies/i)
    await expect(modal).not.toContainText('Lütfen odaya girmeden önce hazırlayın')

    // The reader can tell which announcement is being corrected, so the notice is not just an
    // unexplained retraction of something they half remember.
    const notice = page.getByTestId('announcement-retracted')
    await expect(notice).toContainText('Oda 214 hakkında')
  })

  test('stops reminding once the reader acknowledges the withdrawal', async ({ page }) => {
    await enterDemo(page, 'Receptionist')
    await page.evaluate(async () => {
      await (window as any).useAnnouncementStore.getState().recallAnnouncement('demo-hotel-id', 'demo-ann-2', 'Demo Manager')
    })

    const modal = page.getByTestId('announcement-modal')
    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: /Anladım|Understood/i }).click()
    await expect(modal).toBeHidden()
    await expect(page.getByTestId('announcement-retracted')).toHaveCount(0)

    // Acknowledging is recorded without disturbing when the announcement was originally read.
    const receipt = await page.evaluate(() => {
      const store = (window as any).useAnnouncementStore.getState()
      return store.receipts['demo-ann-2'] || null
    })
    expect(receipt?.state).toBe('dismissed')
    expect(receipt?.recalledAckAt).toBeTruthy()

    // And a reload does not put it back in front of them.
    await page.reload()
    await expect(page.getByTestId('announcement-modal')).toBeHidden()
    await expect(page.getByTestId('announcement-retracted')).toHaveCount(0)
  })

  test('a reader the announcement was not addressed to is told nothing about it', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    // A withdrawal must not leak to people the announcement was never addressed to, and must not
    // tell them they read it. A reader can only end up with no receipt by being left out, because
    // anything shown to them is recorded as read the moment it renders.
    const id = await page.evaluate(async () => {
      const store = (window as any).useAnnouncementStore.getState()
      await store.publishAnnouncement('demo-hotel-id', {
        title: 'Sadece Resepsiyona',
        content: 'Bu duyuru yalnızca gece vardiyası ekibine gider.',
        audience: 'selected',
        recipientIds: ['demo-user-other'],
        recipientNames: ['Someone Else'],
        createdBy: 'demo-user-gm',
        createdByName: 'Demo Manager',
      })
      const created = (window as any).useAnnouncementStore.getState().announcements
      return created.find((item: any) => item.title === 'Sadece Resepsiyona')?.id || null
    })
    expect(id).not.toBeNull()

    await page.evaluate(async (target: string) => {
      await (window as any).useAnnouncementStore.getState().recallAnnouncement('demo-hotel-id', target, 'Demo Manager')
    }, id)

    await expect(page.getByTestId('announcement-modal')).toBeHidden()
    await expect(page.getByTestId('announcement-retracted')).toHaveCount(0)
  })

  test('shows a manager who the withdrawal notice has not reached yet', async ({ page }) => {
    await enterManagerDemo(page)
    await openAnnouncementChannel(page)

    const row = page.getByTestId('announcement-feed-row').filter({ hasText: 'Ramazan servisi değişikliği' })
    await row.getByRole('button', { name: /Yayından geri çek|Withdraw/i }).click()
    const confirm = page.getByRole('alertdialog')
    await confirm.getByRole('button', { name: /Yayından geri çek|Withdraw/i }).click()
    await expect(row).toHaveAttribute('data-recalled', 'true')

    await row.getByRole('button', { name: /Kimler gördü|Who has seen/i }).click()
    const manager = page.getByTestId('announcement-manager')
    const entry = manager.getByTestId('announcement-manager-row').filter({ hasText: 'Ramazan servisi değişikliği' })
    await expect(entry).toHaveAttribute('data-recalled', 'true')
    await entry.locator('button[aria-expanded]').click()

    // Demo Staff read this one, so the correction is still outstanding and is named.
    const warning = entry.locator('div').filter({ hasText: /Geri alma bildirimi|Withdrawal notice/ }).last()
    await expect(warning).toContainText('Demo Staff')
    await expect(warning).toContainText(/1 kişiye daha ulaşmadı|not been reached yet/)

    // Once acknowledged the warning clears, which is the difference between a reminder and a task.
    await page.evaluate(async () => {
      await (window as any).useAnnouncementStore.getState().acknowledgeRecall('demo-hotel-id', 'demo-ann-1', 'demo-user-staff')
    })
    await expect(warning).toContainText(/herkese ulaştı|Everyone who had read it/)
  })

  test('stops reminding a reader after three days and leaves it with the manager instead', async ({ page }) => {
    await enterDemo(page, 'Receptionist')
    // Backdate the withdrawal past the reminder window without waiting three days.
    await page.evaluate(async () => {
      const store = (window as any).useAnnouncementStore
      const state = store.getState()
      await state.recallAnnouncement('demo-hotel-id', 'demo-ann-2', 'Demo Manager')
      // A bare recalledAt cannot be pushed back through the store, so the announcement is re-seeded
      // with an old recall time by writing the demo list directly.
      const list = store.getState().announcements.map((item: any) => item.id === 'demo-ann-2'
        ? { ...item, recalledAt: new Date(Date.now() - 1000 * 60 * 60 * 96) }
        : item)
      store.setState({ announcements: list })
    })

    await expect(page.getByTestId('announcement-modal')).toBeHidden()
    await expect(page.getByTestId('announcement-retracted')).toHaveCount(0)
    // The read record itself is untouched, so the audit still shows when it was read.
    const receipt = await page.evaluate(() => {
      const store = (window as any).useAnnouncementStore.getState()
      return store.receipts['demo-ann-2'] || null
    })
    expect(receipt?.state).toBe('dismissed')
  })
})
