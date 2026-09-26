import { expect, type Page } from '@playwright/test'

type DemoPersona = 'Manager' | 'Receptionist'

const PERSONA: Record<DemoPersona, RegExp> = {
  Manager: /Enter as Manager|Yönetici/i,
  Receptionist: /Enter as Receptionist|Resepsiyon/i,
}

/**
 * Signs into the live demo and clears whatever opens over the dashboard.
 *
 * A pending management announcement arrives as a full screen dialog for the staff persona, and
 * the onboarding wizard renders on top of that, so both have to be dismissed in order. Scenarios
 * that are about the announcement itself pass `keepAnnouncement` to leave the dialog standing.
 */
export async function enterDemo(
  page: Page,
  as: DemoPersona,
  options: { keepAnnouncement?: boolean } = {},
): Promise<void> {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: PERSONA[as] }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  const announcement = page.getByTestId('announcement-modal')

  // Scenarios that are about the announcement itself stop here. They want the dialog left
  // standing, and they dismiss it themselves once they have read what is in it.
  if (options.keepAnnouncement) return

  if (as === 'Receptionist') {
    // Only the receptionist persona has anything pending. Both demo announcements were written by
    // the manager, and nextUnreadAnnouncement skips anything the viewer authored, so the manager
    // never sees this dialog. Waiting for it unconditionally would just add a fixed delay to
    // every scenario that has nothing to dismiss.
    //
    // This has to be a wait rather than an isVisible() probe. The dialog renders once the
    // announcement store has hydrated, which under parallel load lands after the dashboard does.
    // A probe taken that early reads "not there yet", skips the dismissal, and the dialog then
    // opens on top of the onboarding wizard and leaves the close below waiting on a covered
    // button until it times out. That failure looks like a wizard problem and is not one.
    await expect(announcement).toBeVisible({ timeout: 15000 })
    await announcement.getByRole('button', { name: /Okudum, kapat|I have read this/i }).click()
    await expect(announcement).toBeHidden()
  }

  // The onboarding wizard renders after the boot splash, so wait for its own dialog rather than
  // probing early. Its footer carries the step controls, which no other dialog has.
  const tour = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: /^(Geri|Back)$/i }) })
  await tour.getByRole('button', { name: /^(Kapat|Close)$/i }).click({ timeout: 15000 })
}
