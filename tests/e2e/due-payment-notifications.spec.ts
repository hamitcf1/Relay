import { test, expect, type Page } from '@playwright/test'

import { enterDemo } from './helpers'

/**
 * Suite: Due payment notifications
 * Documentation: docs/qa/TEST_CASES.md
 *
 * What this file is for
 * --------------------
 * The manager was told about unpaid sales by one notification that summed what was outstanding
 * across every sale and printed the result with a euro sign hardcoded after it. With an 80 EUR
 * tour and a 5000 TRY transfer that produced "2 sales have a total of 5080 EUR uncollected",
 * which is not a number anyone can go and collect. The same reminder was also gated on a single
 * timestamp, so it either repeated the whole picture on a schedule or said nothing, and a partial
 * payment never produced a new figure.
 *
 * These tests pin the three properties that were wrong: each sale is reported on its own, in the
 * currency it was sold in; a debt is only re-announced when the amount actually changes; and the
 * reminder links to the sale it is about.
 *
 * Why the sales are injected rather than created through the UI
 * -----------------------------------------------------------
 * Mixed currencies are the whole point, and the demo fixture holds a single sale in a single
 * currency. Writing three sales in three currencies through the sales form would test the form as
 * much as the reminder, and the form cannot be driven from the dashboard without opening five
 * panels. Setting the store directly is what these tests are actually about, and the notifier is
 * driven off that same store, so the code path from store to notification is the production one.
 *
 * A note on localStorage
 * ----------------------
 * The record of what has already been reported is keyed by hotel in localStorage, and a Playwright
 * page keeps that across a reload. The "does not repeat" cases rely on that: the second run finds
 * the record the first run wrote. It is also why these tests do not share a page with the store
 * reset suite, which clears it.
 */

const DEMO_HOTEL = 'demo-hotel-id'

type StoreMap = Record<string, { getState: () => any; setState: (patch: any) => void }>

declare global {
    interface Window {
        __relayStores?: StoreMap
    }
}

/**
 * Enters the demo as the manager and returns the store surface.
 *
 * The notifier is gated on the gm role, so the receptionist persona would produce nothing here and
 * a test written against it would pass for the wrong reason.
 */
async function managerStores(page: Page): Promise<StoreMap> {
    await enterDemo(page, 'Manager')
    const stores = await page.evaluate(() => window.__relayStores)
    expect(stores, 'the dev-only store test hooks are not installed').toBeTruthy()
    return stores!
}

/** The notifications the manager currently holds, newest first, as the dropdown would show them. */
function paymentNotifications(page: Page) {
    return page.evaluate(() =>
        window.__relayStores!.useNotificationStore.getState().notifications
            .filter((n: any) => n.type === 'payment')
            .map((n: any) => ({ title: n.title, content: n.content, link: n.link }))
    )
}

/**
 * Replaces the sales with `sales` and waits for the reminder to settle.
 *
 * The notifier runs off an effect keyed on the sales list, so setting the store is what makes it
 * look at the new data. The wait is for the effect and its writes to finish rather than a fixed
 * pause, so a slow machine does not turn into a flake.
 */
async function setSalesAndSettle(page: Page, sales: any[]) {
    await page.evaluate(({ hotelId, sales }) => {
        window.__relayStores!.useSalesStore.setState({ sales, loaded: true, loading: false })
    }, { hotelId: DEMO_HOTEL, sales })

    // One turn of the effect plus the notification writes it kicks off. The writes are awaited in
    // sequence inside the effect, so the count is only final once they have all landed.
    await page.waitForFunction(
        (expected) => {
            const state = window.__relayStores!.useNotificationStore.getState()
            return state.notifications.filter((n: any) => n.type === 'payment').length >= expected
        },
        1,
        { timeout: 10000 }
    ).catch(() => { /* asserted by the caller with a real message */ })
}

/** Builds a sale with the fields the reminder reads, so a test only states what it cares about. */
function sale(overrides: Record<string, any>) {
    return {
        id: 'sale-1',
        hotel_id: DEMO_HOTEL,
        type: 'tour',
        name: 'Cappadocia tour',
        customer_name: 'Ayşe Yılmaz',
        room_number: '101',
        pax: 2,
        date: new Date('2026-03-01T09:00:00Z'),
        total_price: 100,
        collected_amount: 0,
        currency: 'EUR',
        payment_status: 'pending',
        status: 'confirmed',
        created_by: 'demo-user-gm',
        created_by_name: 'Manager',
        created_at: new Date('2026-03-01T09:00:00Z'),
        payments: [],
        ...overrides,
    }
}

test.describe('Due payment notifications', () => {

    test('reports the demo sale in its own currency, with a link to that sale', async ({ page }) => {
        await managerStores(page)

        // The demo fixture owes 45 EUR on one transfer. Nothing has to be injected to see the real
        // shape of a reminder, which is the point: this is what a manager sees on a first login.
        await expect
            .poll(async () => (await paymentNotifications(page)).length, { timeout: 15000 })
            .toBeGreaterThan(0)

        const [first] = await paymentNotifications(page)
        expect(first.content).toContain('45')
        expect(first.content).toContain('EUR')
        expect(first.content).toContain('305')            // the room, so the debt can be traced
        expect(first.link).toBe(`/operations?tab=sales&sale=demo-sale-transfer`)

        // The old wording. If this ever comes back, the amounts are being summed again.
        expect(first.content).not.toMatch(/toplam|total of/i)
    })

    test('reports each sale separately instead of summing across currencies', async ({ page }) => {
        await managerStores(page)

        await setSalesAndSettle(page, [
            sale({ id: 'sale-eur', name: 'Cappadocia tour', total_price: 80, collected_amount: 0, currency: 'EUR' }),
            sale({ id: 'sale-try', name: 'Airport transfer', room_number: '202', total_price: 5000, collected_amount: 0, currency: 'TRY' }),
            sale({ id: 'sale-usd', name: 'Restaurant dinner', room_number: '303', total_price: 120, collected_amount: 0, currency: 'USD' }),
        ])

        const payments = await paymentNotifications(page)
        const forInjected = payments.filter((n) => /sale-(eur|try|usd)/.test(n.link || ''))

        expect(forInjected).toHaveLength(3)

        // Each reminder carries its own figure in its own currency. The failure this replaces
        // summed the raw numbers, so 80 + 5000 + 120 came out as "5200 EUR".
        const eur = forInjected.find((n) => n.link?.includes('sale-eur'))!
        const trySale = forInjected.find((n) => n.link?.includes('sale-try'))!
        const usd = forInjected.find((n) => n.link?.includes('sale-usd'))!

        expect(eur.content).toContain('80')
        expect(eur.content).toContain('EUR')

        expect(trySale.content).toContain('5.000')       // tr-TR thousands separator
        expect(trySale.content).toContain('TRY')
        expect(trySale.content).not.toContain('EUR')

        expect(usd.content).toContain('120')
        expect(usd.content).toContain('USD')
        expect(usd.content).not.toContain('EUR')

        // No reminder may quote a figure that is a sum of the three.
        for (const n of forInjected) {
            expect(n.content).not.toContain('5200')
            expect(n.content).not.toContain('5.200')
        }
    })

    test('announces the new remaining figure after a partial payment, and stays quiet otherwise',
        async ({ page }) => {
            await managerStores(page)

            await setSalesAndSettle(page, [
                sale({ id: 'sale-partial', total_price: 100, collected_amount: 0, currency: 'EUR' })
            ])

            const initial = await paymentNotifications(page)
            const firstCount = initial.filter((n) => n.link?.includes('sale-partial')).length
            expect(firstCount).toBe(1)
            expect(initial.find((n) => n.link?.includes('sale-partial'))!.content).toContain('100')

            // Nothing has changed, so nothing is said. This is the case that used to re-fire on the
            // four hour gate, and it is why a manager learned to ignore the reminder.
            await setSalesAndSettle(page, [
                sale({ id: 'sale-partial', total_price: 100, collected_amount: 0, currency: 'EUR' })
            ])
            await page.waitForTimeout(400)
            expect((await paymentNotifications(page)).filter((n) => n.link?.includes('sale-partial'))).toHaveLength(1)

            // 30 collected of 100 leaves 70, and that is worth saying: it is the figure to go and
            // chase. The old code never reported it, because the timestamp had already fired.
            await setSalesAndSettle(page, [
                sale({ id: 'sale-partial', total_price: 100, collected_amount: 30, currency: 'EUR' })
            ])
            await expect
                .poll(async () =>
                    (await paymentNotifications(page)).filter((n) => n.link?.includes('sale-partial')).length,
                    { timeout: 10000 }
                )
                .toBe(2)

            const after = (await paymentNotifications(page)).filter((n) => n.link?.includes('sale-partial'))
            expect(after[0].content).toContain('70')
            expect(after[0].content).not.toContain('100')
        })

    test('does not repeat a debt on a fresh sign in, but does report a changed one', async ({ page }) => {
        await managerStores(page)

        await expect
            .poll(async () => (await paymentNotifications(page)).length, { timeout: 15000 })
            .toBeGreaterThan(0)
        expect((await paymentNotifications(page)).filter((n) => n.link?.includes('demo-sale-transfer'))).toHaveLength(1)

        // The demo session lives in memory, so re-entering is a full page load with an empty app
        // but the same localStorage, which is where the record of what has been reported lives.
        // That is the honest equivalent of a manager closing the laptop and coming back, and it is
        // exactly what the old four hour gate got wrong: a new session re-announced everything.
        await enterDemo(page, 'Manager')

        // Wait for the app to be fully up before asserting that nothing arrived. The two demo
        // fixtures landing means the dashboard mounted and the notification dropdown subscribed,
        // so the reminder has had its chance to fire.
        await expect
            .poll(async () =>
                page.evaluate(() => window.__relayStores?.useNotificationStore.getState().notifications.length ?? 0),
                { timeout: 15000 }
            )
            .toBeGreaterThanOrEqual(2)
        await page.waitForTimeout(800)

        expect(
            (await paymentNotifications(page)).filter((n) => n.link?.includes('demo-sale-transfer')),
            'a debt that has not changed must stay quiet in a new session'
        ).toHaveLength(0)

        // And the record that silences it is still on file, so this is a decision rather than the
        // reminder simply having not run.
        const record = await page.evaluate(
            (hotelId) => localStorage.getItem(`last_payment_check_${hotelId}`),
            DEMO_HOTEL
        )
        expect(record).toContain('demo-sale-transfer')

        // Still not a blanket suppression: the record is compared, so a sale whose outstanding
        // amount has moved is reported again, even in a new session.
        await setSalesAndSettle(page, [
            sale({ id: 'demo-sale-transfer', name: 'Airport transfer', room_number: '305', total_price: 45, collected_amount: 20, currency: 'EUR' })
        ])
        await expect
            .poll(async () =>
                (await paymentNotifications(page)).filter((n) => n.link?.includes('demo-sale-transfer')).length,
                { timeout: 10000 }
            )
            .toBe(1)

        const latest = (await paymentNotifications(page)).find((n) => n.link?.includes('demo-sale-transfer'))!
        expect(latest.content).toContain('25')
    })

    test('the reminder link opens that sale, and closing it clears the link', async ({ page }) => {
        await managerStores(page)
        await expect
            .poll(async () => (await paymentNotifications(page)).length, { timeout: 15000 })
            .toBeGreaterThan(0)

        // Clicked rather than navigated to with page.goto. The demo session lives in memory, so a
        // full page load would sign the manager out and land on the login form, and in-app
        // navigation is what a manager actually does with a reminder anyway.
        const [reminder] = await paymentNotifications(page)
        await page.getByRole('button', { name: /Bildirimler|Notifications/i }).first().click()
        await page.getByText(reminder.content, { exact: false }).first().click()

        // The link the notification carries is followed verbatim, so the reminder and the
        // destination cannot drift apart.
        await expect(page).toHaveURL(/tab=sales/, { timeout: 15000 })
        await expect(page).toHaveURL(/[?&]sale=demo-sale-transfer/, { timeout: 15000 })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible({ timeout: 15000 })
        await expect(dialog).toContainText('Airport transfer')

        // The dropdown stays open on select, so the first Escape closes it and the second reaches
        // the dialog. Closing has to take the id back out of the URL, or a refresh would reopen the
        // sale the manager just dismissed.
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden({ timeout: 10000 })
        await expect(page).not.toHaveURL(/[?&]sale=/, { timeout: 10000 })
    })

    test('forgets a settled sale, so the same debt is reported again if it reopens', async ({ page }) => {
        await managerStores(page)
        await setSalesAndSettle(page, [
            sale({ id: 'sale-cycle', total_price: 60, collected_amount: 0, currency: 'EUR' })
        ])
        expect((await paymentNotifications(page)).filter((n) => n.link?.includes('sale-cycle'))).toHaveLength(1)

        // Settled in full: nothing owed, and the record of it has to go too.
        await setSalesAndSettle(page, [
            sale({ id: 'sale-cycle', total_price: 60, collected_amount: 60, currency: 'EUR', payment_status: 'paid' })
        ])
        await page.waitForTimeout(400)
        expect((await paymentNotifications(page)).filter((n) => n.link?.includes('sale-cycle'))).toHaveLength(1)

        const record = await page.evaluate(
            (hotelId) => localStorage.getItem(`last_payment_check_${hotelId}`),
            DEMO_HOTEL
        )
        expect(record, 'a settled sale must not stay on file').not.toContain('sale-cycle')

        // Reopened at the same figure. Identical to the first state, so if the record had survived
        // this would be silenced and the reopened debt would go unreported.
        await setSalesAndSettle(page, [
            sale({ id: 'sale-cycle', total_price: 60, collected_amount: 0, currency: 'EUR' })
        ])
        await expect
            .poll(async () =>
                (await paymentNotifications(page)).filter((n) => n.link?.includes('sale-cycle')).length,
                { timeout: 10000 }
            )
            .toBe(2)
    })
})
