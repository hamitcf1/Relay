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
 * the guided tour renders on top of that, so both have to be dismissed in order. Scenarios that
 * are about the announcement itself pass `keepAnnouncement` to leave the dialog standing.
 */
export async function enterDemo(
  page: Page,
  as: DemoPersona,
  options: { keepAnnouncement?: boolean } = {},
): Promise<void> {
  await page.goto('/live-demo')
  await page.getByRole('button', { name: PERSONA[as] }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  if (options.keepAnnouncement) return

  const announcement = page.getByTestId('announcement-modal')
  if (await announcement.isVisible().catch(() => false)) {
    await announcement.getByRole('button', { name: /Okudum, kapat|I have read this/i }).click()
    await expect(announcement).toBeHidden()
  }
  // The tour renders after the boot splash, so wait for its own dialog rather than probing early.
  // Its footer carries the step controls, which no other dialog on the dashboard has.
  const tour = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: /^(Geri|Back)$/i }) })
  await tour.getByRole('button', { name: /^(Kapat|Close)$/i }).click({ timeout: 15000 })
}
