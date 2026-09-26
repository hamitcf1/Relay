import { test, expect, type Page } from '@playwright/test'

import { enterDemo } from './helpers'

/**
 * Suite: Notification list page
 * Documentation: docs/qa/TEST_CASES.md
 *
 * What this file is for
 * --------------------
 * The badge dropdown was the only view of notifications. It capped its scroll at 400px and laid
 * every notification out as one flat run, so a manager partway through a shift could not tell a
 * payment reminder from a message without reading down the stack, and its "view all" link went to
 * /operations?tab=activity, which is the activity log and does not list notifications at all.
 *
 * These tests cover the page that replaced it: reached from that link, grouped by day, with the
 * read, dismiss and clear actions working.
 *
 * Why every step clicks rather than navigating
 * ---------------------------------------------
 * The demo session lives in memory. `page.goto` is a full page load and would sign the manager out
 * mid-test, so anything reached by going "back" into the dashboard is done with the app's own
 * navigation. That is also what a user does.
 */

const DEMO_HOTEL = 'demo-hotel-id'

declare global {
    interface Window {
        __relayStores?: Record<string, { getState: () => any; setState: (patch: any) => void }>
    }
}

/**
 * Opens the badge and clicks its "view all" footer, then waits for the page's own subscription to
 * land.
 *
 * The wait is not padding. The URL changes before React mounts the page, and the page subscribes in
 * an effect, so a test that seeds the store as soon as the URL matches is racing the subscription.
 * The demo seed merges rather than replaces, so anything seeded first has the two fixtures merged
 * back on top of it afterwards, and the counts come out wrong for reasons that have nothing to do
 * with the code under test.
 */
async function openNotificationsPage(page: Page) {
    await page.getByRole('button', { name: /Bildirimler|Notifications/i }).first().click()
    await page.getByText(/Tüm Bildirimleri Gör|View All Notifications|Все уведомления/).click()
    await expect(page).toHaveURL(/\/notifications$/, { timeout: 15000 })
    await page.waitForFunction(
        () => window.__relayStores?.useNotificationStore.getState().notifications
            .some((n: any) => n.id === 'demo-fixture-welcome'),
        undefined,
        { timeout: 15000 }
    )
}

/**
 * Replaces the notification list with `items`.
 *
 * Only safe once the page has subscribed, or the seed merges the demo fixtures back in on top. The
 * merge is deliberate: it is what stopped the paid-sale reminder from being thrown away on every
 * demo login, and it is what lets a test set up a known list here.
 */
async function seedNotifications(page: Page, items: any[]) {
    await page.evaluate((items) => {
        const store = window.__relayStores!.useNotificationStore
        store.setState({
            notifications: items,
            unreadCount: items.filter((n: any) => !n.is_read).length
        })
    }, items)
    // Let the re-render land before the next assertion reads the DOM.
    await page.waitForFunction(
        (expected) => window.__relayStores?.useNotificationStore.getState().notifications.length === expected,
        items.length,
        { timeout: 5000 }
    )
}

/** An hour, a day and a week ago, so the day grouping has something to group. */
function notification(id: string, hoursAgo: number, overrides: Record<string, any> = {}) {
    return {
        id,
        type: 'system',
        title: `Title ${id}`,
        content: `Body ${id}`,
        timestamp: new Date(Date.now() - hoursAgo * 3600 * 1000),
        is_read: false,
        ...overrides,
    }
}

test.describe('Notification list page', () => {

    test('the badge footer leads here, and not to the activity log', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)

        // The old destination, and the reason this page exists: /operations?tab=activity renders
        // activity_logs, which never contained a notification.
        await expect(page).not.toHaveURL(/tab=activity/)

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Bildirimler|Notifications/)
        await expect(page.getByText('This is a simulated environment. Feel free to explore!')).toBeVisible()
    })

    test('groups by day, newest first, and cuts the days on local midnight', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)

        await seedNotifications(page, [
            notification('now', 0, { content: 'Just happened' }),
            // Deliberately inside the current day but not the last 24 hours, which is the case a
            // rolling 24 hour window would have filed under the wrong heading.
            notification('earlier-today', 20, { content: 'Earlier today' }),
            notification('yesterday', 30, { content: 'Yesterday item' }),
            notification('last-week', 24 * 7, { content: 'Last week item' }),
        ])

        const headings = page.locator('main h2')
        await expect(headings).toHaveCount(3)

        // Order is by day, newest first, and "now"/"earlier-today" share a bucket despite being
        // 20 hours apart.
        await expect(headings.nth(0)).toHaveText(/Bugün|Today/)
        await expect(headings.nth(1)).toHaveText(/Dün|Yesterday/)
        await expect(headings.nth(2)).not.toHaveText(/Bugün|Today|Dün|Yesterday/)

        const todaySection = page.locator('main section').nth(0)
        await expect(todaySection.getByText('Just happened')).toBeVisible()
        await expect(todaySection.getByText('Earlier today')).toBeVisible()
        await expect(todaySection.getByText('Yesterday item')).toHaveCount(0)
    })

    test('shows the exact time on the page, not a relative one', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)
        await seedNotifications(page, [notification('timed', 0, { content: 'Timed item' })])

        // The dropdown has a narrow column, so a full timestamp would either reflow as the
        // relative text changed width or sit at an unpredictable distance from the title. The page
        // has the room and opts in.
        const time = page.locator('main time').first()
        await expect(time).toHaveText(/\d{2}:\d{2}/)
        await expect(time).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/)
    })

    test('opening one marks it read and follows its link', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)
        await seedNotifications(page, [
            notification('read-me', 0, {
                content: 'Awaits payment',
                type: 'payment',
                link: `/operations?tab=sales&sale=demo-sale-transfer`
            })
        ])

        await expect(page.getByText(/okunmamış|unread/).first()).toBeVisible()

        await page.getByText('Awaits payment').click()

        await expect(page).toHaveURL(/tab=sales/, { timeout: 15000 })
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

        // Scoped to this notification. Following the link leaves the page and mounts the dashboard,
        // whose dropdown subscribes and merges the demo fixtures back in, so a whole-store unread
        // count would be measuring those rather than this one.
        const isRead = await page.evaluate(() =>
            window.__relayStores!.useNotificationStore.getState().notifications
                .find((n: any) => n.id === 'read-me')?.is_read
        )
        expect(isRead, 'opening a notification has to mark it read').toBe(true)
    })

    test('mark all read clears the badge without removing anything', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)
        await seedNotifications(page, [
            notification('a', 0, { content: 'First item' }),
            notification('b', 1, { content: 'Second item' })
        ])

        const before = await page.evaluate(() =>
            window.__relayStores!.useNotificationStore.getState().notifications.length
        )

        await page.getByRole('button', { name: /Tümünü okundu işaretle|Mark all/i }).click()

        const state = await page.evaluate(() => {
            const s = window.__relayStores!.useNotificationStore.getState()
            return { unread: s.unreadCount, total: s.notifications.length }
        })
        expect(state.unread).toBe(0)
        // Marking read is not deleting. The two seeded rows and the two demo fixtures all survive.
        expect(state.total).toBe(before)

        // And the header says so, rather than leaving a stale count.
        await expect(page.getByText(/Hepsi okundu|All read/)).toBeVisible()
    })

    test('clear all empties the list and shows the empty state', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)
        await seedNotifications(page, [notification('doomed', 0, { content: 'About to be cleared' })])
        await expect(page.getByText('About to be cleared')).toBeVisible()

        // The confirm button used to be labelled with common.clear, which is the chat's
        // "Sohbeti Temizle" in Turkish. If that regresses, the label stops naming the action.
        await page.getByRole('button', { name: /Tümünü Temizle|Clear All/i }).click()
        const confirmButton = page.getByRole('button', { name: /Tümünü Temizle|Clear All/i }).last()
        await expect(confirmButton).toBeVisible()
        await confirmButton.click()

        await expect(page.getByText(/Yeni bildirim yok|No notifications/)).toBeVisible({ timeout: 10000 })
        const remaining = await page.evaluate(() =>
            window.__relayStores!.useNotificationStore.getState().notifications.length
        )
        expect(remaining).toBe(0)
    })

    test('every control on the page has an accessible name', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)
        await seedNotifications(page, [
            notification('a', 0, { content: 'First item' }),
            notification('b', 1, { content: 'Second item' })
        ])

        // Approximates the accessible name: aria-label, else title, else the text inside. Not the
        // full accessibility tree computation, but it catches the case that actually happened, an
        // icon-only button whose visible label is hidden by a breakpoint and whose icon is
        // aria-hidden, leaving a control a screen reader cannot name at all.
        const nameless = await page.evaluate(() => {
            const buttons = [...document.querySelectorAll('main button, header button')]
            return buttons
                .filter((b) => !(b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent?.trim()))
                .map((b) => b.outerHTML.slice(0, 120))
        })

        expect(nameless, 'these controls have no accessible name').toEqual([])
    })

    test('dismissing one leaves the rest alone', async ({ page }) => {
        await enterDemo(page, 'Manager')
        await openNotificationsPage(page)
        await seedNotifications(page, [
            notification('keep', 0, { content: 'Keep this one' }),
            notification('drop', 0, { content: 'Drop this one' })
        ])

        // Scoped to the row, not the page. The dismiss control sits in every row, so a page-wide
        // locator would click whichever happened to come first in the list.
        const row = page.locator('main li').filter({ hasText: 'Drop this one' })
        await row.hover()
        await row.getByRole('button', { name: /Kapat|Dismiss/ }).click()

        await expect(page.getByText('Drop this one')).toHaveCount(0)
        await expect(page.getByText('Keep this one')).toBeVisible()
    })
})
