import { test, expect } from '@playwright/test'

import { enterDemo } from './helpers'

/**
 * Exercises the announcement store's own write path in the browser, which is where the read
 * receipt bugs lived.
 *
 * The pure selection logic in src/lib/announcements.ts is covered by announcement-logic.spec.ts.
 * That is not the same thing: this file goes through the store actions the UI actually calls, and
 * the store used to disagree with the demo helpers underneath it. It wrote a fresh seenAt on
 * dismissal, which only the demo path got right, so the record of when someone first read an
 * announcement was destroyed the moment they closed it.
 *
 * The demo persona is used because it needs no Firebase project. That is also the trap this file
 * has to be honest about: the demo store path is in memory, so it cannot prove the Firestore
 * query shape. That is covered by the rules tests, which run the real queries against the
 * emulator.
 */

declare global {
    interface Window {
        useAnnouncementStore?: {
            getState: () => {
                receipts: Record<string, any>
                announcements: Array<{ id: string; title?: string; content: string }>
                markSeen: (hotelId: string, announcementId: string, uid: string) => Promise<void>
                markDismissed: (hotelId: string, announcementId: string, uid: string) => Promise<void>
                acknowledgeRecall: (hotelId: string, announcementId: string, uid: string) => Promise<void>
            }
        }
    }
}

const DEMO_HOTEL = 'demo-hotel-id'
const DEMO_STAFF = 'demo-user-staff'
/** The demo seeds one announcement as already closed for the staff persona. */
const DEMO_PRESEALED_DISMISSED = 'demo-ann-1'

test('closing an announcement keeps the time it was first read', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    const result = await page.evaluate(async ({ hotelId, uid, preclosed }) => {
        const store = window.useAnnouncementStore
        if (!store) throw new Error('demo store is not exposed')

        // Deliberately not "the first announcement": one of them is seeded as already closed, and
        // marking that one seen is a no-op by design, so picking it would test nothing.
        const target = store.getState().announcements.find((item) => item.id !== preclosed)
        if (!target) throw new Error('no demo announcement to work with')

        await store.getState().markSeen(hotelId, target.id, uid)
        const seenAt = store.getState().receipts[target.id]?.seenAt?.getTime()

        await store.getState().markDismissed(hotelId, target.id, uid)
        const afterDismissed = store.getState().receipts[target.id]

        return {
            seenAt,
            stateAfterDismissed: afterDismissed?.state,
            seenAtAfterDismissed: afterDismissed?.seenAt?.getTime(),
            dismissedAt: afterDismissed?.dismissedAt?.getTime(),
        }
    }, { hotelId: DEMO_HOTEL, uid: DEMO_STAFF, preclosed: DEMO_PRESEALED_DISMISSED })

    expect(result.stateAfterDismissed).toBe('dismissed')
    expect(result.dismissedAt).toBeGreaterThan(0)

    // The moment of reading is the audit trail. Closing an announcement happens minutes later and
    // must not overwrite it, or there is no way to tell when someone was actually told something.
    expect(result.seenAt).toBeGreaterThan(0)
    expect(result.seenAtAfterDismissed).toBe(result.seenAt)
})

test('reopening an announcement does not move the recorded time it was first read', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    const result = await page.evaluate(async ({ hotelId, uid, preclosed }) => {
        const store = window.useAnnouncementStore
        if (!store) throw new Error('demo store is not exposed')
        const target = store.getState().announcements.find((item) => item.id !== preclosed)
        if (!target) throw new Error('no demo announcement to work with')

        await store.getState().markSeen(hotelId, target.id, uid)
        const first = store.getState().receipts[target.id]?.seenAt?.getTime()

        // A banner reappears on every visit until it is closed, so markSeen runs again and again.
        // If that pushed seenAt forward the receipt would answer "when did they last look" instead
        // of "when were they told", which is the whole point of keeping it.
        await new Promise((resolve) => setTimeout(resolve, 15))
        await store.getState().markSeen(hotelId, target.id, uid)

        return { first, second: store.getState().receipts[target.id]?.seenAt?.getTime() }
    }, { hotelId: DEMO_HOTEL, uid: DEMO_STAFF, preclosed: DEMO_PRESEALED_DISMISSED })

    expect(result.first).toBeGreaterThan(0)
    expect(result.second).toBe(result.first)
})

test('reopening a closed announcement does not put it back to unread', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    const states = await page.evaluate(async ({ hotelId, uid, preclosed }) => {
        const store = window.useAnnouncementStore
        if (!store) throw new Error('demo store is not exposed')

        const target = store.getState().announcements.find((item) => item.id !== preclosed)
        if (!target) throw new Error('no demo announcement to work with')

        await store.getState().markDismissed(hotelId, target.id, uid)
        const afterDismiss = store.getState().receipts[target.id]?.state

        // A re-render can mark it seen again. That must not undo the close, or the banner comes
        // back for something the person deliberately shut.
        await store.getState().markSeen(hotelId, target.id, uid)
        const afterReseen = store.getState().receipts[target.id]?.state

        return { afterDismiss, afterReseen }
    }, { hotelId: DEMO_HOTEL, uid: DEMO_STAFF, preclosed: DEMO_PRESEALED_DISMISSED })

    expect(states.afterDismiss).toBe('dismissed')
    expect(states.afterReseen).toBe('dismissed')
})

test('a closed announcement leaves the banner entirely', async ({ page }) => {
    await enterDemo(page, 'Receptionist')

    // Both demo announcements are handled for this persona: one is seeded closed, and the other
    // is closed by the modal that enterDemo dismisses. The banner has nothing left to say, and the
    // fix is that it disappears rather than lingering with a disabled close button.
    await expect(page.getByTestId('announcement-banner')).toHaveCount(0)
})
