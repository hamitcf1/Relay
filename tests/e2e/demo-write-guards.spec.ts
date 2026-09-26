import { test, expect, type Page } from '@playwright/test'

import { enterDemo } from './helpers'

/**
 * Suite: Demo write guards
 * Documentation: docs/qa/TEST_CASES.md
 *
 * What this file is for
 * --------------------
 * The live demo signs in without a Firebase session, so its hotel id is the fixture
 * "demo-hotel-id" and every write to Firestore is rejected. Most stores already knew that and
 * kept a local in-memory copy, but the checks had drifted: roomStore had ten write actions and
 * none of them, pricingStore and salesStore had none, and src/lib/calendar-sync.ts had never had
 * any. In the demo those writes surfaced as permission-denied errors, thrown promises the UI did
 * not catch, and toasts telling the user a save had failed.
 *
 * These tests pin the behaviour from both sides. Each scenario calls the store action and then
 * asserts the local state actually changed, because a guard that silently returns without
 * mutating anything would pass a "did not throw" check while leaving the demo looking broken.
 * The Firestore path is deliberately not exercised here: the demo persona has no project, so a
 * real write is rejected by construction.
 *
 * How the guards are found
 * ------------------------
 * A static scan looks for Firestore writes in src/stores and src/lib with neither a
 * "demo-hotel-id" nor an "is_demo" check, then keeps only the ones a component can actually call.
 * That scan is the guard against this drifting back: it is run as its own test at the bottom of
 * this file, so adding a store action without a guard fails the suite rather than waiting for
 * someone to notice a broken demo.
 */

const DEMO_HOTEL = 'demo-hotel-id'
const DEMO_GM = 'demo-user-gm'

type StoreMap = Record<string, { getState: () => any }>

declare global {
    interface Window {
        __relayStores?: StoreMap
    }
}

/**
 * Enters the demo, then returns the store surface. Fails the test with a clear message rather
 * than throwing on undefined, because a missing hook means the dev build is not being served.
 */
async function demoStores(page: Page): Promise<StoreMap> {
    await enterDemo(page, 'Manager')
    const stores = await page.evaluate(() => window.__relayStores)
    expect(stores, 'the dev-only store test hooks are not installed').toBeTruthy()
    return stores!
}

/** Fails if the page logged a Firestore authorization failure or an unhandled rejection. */
function watchForFirestoreErrors(page: Page) {
    const errors: string[] = []
    page.on('console', (message) => {
        if (message.type() !== 'error') return
        const text = message.text()
        if (/permission-denied|Missing or insufficient permissions|FirestoreError/i.test(text)) {
            errors.push(text)
        }
    })
    page.on('pageerror', (error) => {
        if (/permission-denied|insufficient permissions/i.test(String(error))) {
            errors.push(String(error))
        }
    })
    return errors
}

test.describe('Demo write guards', () => {

    test('room writes update the local rooms list', async ({ page }) => {
        const stores = await demoStores(page)
        const errors = watchForFirestoreErrors(page)

        const outcome = await page.evaluate(async (hotelId) => {
            const store = window.__relayStores!.useRoomStore.getState()
            // The room panel owns the subscription, and it only mounts when that module is opened,
            // so a test that skips it would be asserting against an empty list.
            store.subscribeToRooms(hotelId)
            const afterSubscribe = window.__relayStores!.useRoomStore.getState().rooms
            const before = afterSubscribe.length
            const firstRoom = afterSubscribe[0]?.id

            await store.addRoom(hotelId, {
                number: '999', type: 'standard', status: 'clean', occupancy: 'vacant', floor: 9,
            })
            const afterAdd = window.__relayStores!.useRoomStore.getState().rooms

            await store.setKeyCardCount(hotelId, firstRoom, 3)
            const afterKeyCard = window.__relayStores!.useRoomStore.getState().rooms

            await store.addLoan(hotelId, firstRoom, { item: 'kettle', qty: 1 })
            const afterLoan = window.__relayStores!.useRoomStore.getState().rooms

            await store.returnLoan(hotelId, firstRoom, afterLoan.find((r: any) => r.id === firstRoom)?.active_loans?.[0]?.id)
            const afterReturn = window.__relayStores!.useRoomStore.getState().rooms

            await store.deleteRoom(hotelId, afterAdd[afterAdd.length - 1].id)

            return {
                before,
                addedNumber: afterAdd[afterAdd.length - 1].number,
                keyCards: afterKeyCard.find((r: any) => r.id === firstRoom)?.key_card_count,
                loanCount: afterLoan.find((r: any) => r.id === firstRoom)?.active_loans?.length,
                afterReturnCount: afterReturn.find((r: any) => r.id === firstRoom)?.active_loans?.length,
                finalCount: window.__relayStores!.useRoomStore.getState().rooms.length,
            }
        }, DEMO_HOTEL)

        expect(outcome.before).toBeGreaterThan(0)
        expect(outcome.addedNumber).toBe('999')
        expect(outcome.keyCards).toBe(3)
        expect(outcome.loanCount).toBe(1)
        expect(outcome.afterReturnCount).toBe(0)
        expect(outcome.finalCount).toBe(outcome.before)
        expect(errors, errors.join('\n')).toHaveLength(0)
    })

    test('a note that matters reaches the calendar, and resolving it takes it back out', async ({ page }) => {
        const stores = await demoStores(page)
        const errors = watchForFirestoreErrors(page)

        const outcome = await page.evaluate(async (hotelId) => {
            const S = window.__relayStores!
            const notes = S.useNotesStore.getState()
            const noteId = notes.notes[0]?.id
            if (!noteId) return { skipped: true }

            // Editing the note re-runs the sync. The event has to land under a predictable id,
            // because resolving the note later has to be able to find and remove it again.
            await S.useNotesStore.getState().updateNote(hotelId, noteId, { content: 'Rewritten for the calendar sync check' })
            const eventId = `demo-note-event-${noteId}`
            const created = S.useCalendarStore.getState().events.find((e: any) => e.id === eventId)

            // Resolving it should take the linked event back out.
            await S.useNotesStore.getState().updateNoteStatus(hotelId, noteId, 'resolved', 'demo-user-gm')
            const afterResolve = S.useCalendarStore.getState()
                .events.filter((e: any) => e.id === eventId).length

            return {
                skipped: false,
                eventId,
                createdTitle: created?.title,
                createdUnderStableId: Boolean(created),
                afterResolve,
            }
        }, DEMO_HOTEL)

        expect(outcome.skipped, 'the demo seeds no shift notes to work with').toBeFalsy()
        expect(outcome.createdUnderStableId, 'the linked event was not stored under its predictable id').toBe(true)
        // The title is truncated to 30 characters by the sync, so match on the prefix.
        expect(outcome.createdTitle).toContain('Rewritten for the cale')
        expect(outcome.afterResolve, 'resolving a note should remove its calendar event').toBe(0)
        expect(errors, errors.join('\n')).toHaveLength(0)
    })

    test('selling a tour and taking payment keeps the local sale and calendar in step', async ({ page }) => {
        const stores = await demoStores(page)
        const errors = watchForFirestoreErrors(page)

        const outcome = await page.evaluate(async (hotelId) => {
            const S = window.__relayStores!
            const saleId = await S.useSalesStore.getState().addSale(hotelId, {
                type: 'tour',
                name: 'Demo Cappadocia Tour',
                customer_name: 'Demo Guest',
                room_number: '101',
                pax: 2,
                date: new Date(),
                total_price: 80,
                currency: 'EUR',
                created_by: 'demo-user-staff',
                created_by_name: 'Receptionist',
            } as any)

            const created = S.useSalesStore.getState().sales.find((s: any) => s.id === saleId)
            const linkedEvent = S.useCalendarStore.getState().events.find((e: any) => e.id === created?.calendar_event_id)

            await S.useSalesStore.getState().collectPayment(hotelId, saleId, 30, 'EUR', 30)
            const partial = S.useSalesStore.getState().sales.find((s: any) => s.id === saleId)
            const eventAfterPayment = S.useCalendarStore.getState().events
                .find((e: any) => e.id === created?.calendar_event_id)

            await S.useSalesStore.getState().collectPayment(hotelId, saleId, 50, 'EUR', 50)
            const paid = S.useSalesStore.getState().sales.find((s: any) => s.id === saleId)

            await S.useSalesStore.getState().refundPayment(hotelId, saleId)
            const refunded = S.useSalesStore.getState().sales.find((s: any) => s.id === saleId)

            await S.useSalesStore.getState().deleteSale(hotelId, saleId)
            const stillThere = S.useSalesStore.getState().sales.some((s: any) => s.id === saleId)
            const eventStillThere = S.useCalendarStore.getState().events
                .some((e: any) => e.id === created?.calendar_event_id)

            return {
                statusAtStart: created?.payment_status,
                hasEvent: Boolean(linkedEvent),
                partialStatus: partial?.payment_status,
                partialCollected: partial?.collected_amount,
                eventCollectedAfterPayment: eventAfterPayment?.collected_amount,
                paidStatus: paid?.payment_status,
                refundedStatus: refunded?.payment_status,
                refundedCollected: refunded?.collected_amount,
                stillThere,
                eventStillThere,
            }
        }, DEMO_HOTEL)

        expect(outcome.statusAtStart).toBe('pending')
        expect(outcome.hasEvent, 'a tour sale should create a linked calendar event').toBe(true)
        expect(outcome.partialStatus).toBe('partial')
        expect(outcome.partialCollected).toBe(30)
        expect(outcome.eventCollectedAfterPayment).toBe(30)
        expect(outcome.paidStatus).toBe('paid')
        expect(outcome.refundedStatus).toBe('refunded')
        expect(outcome.refundedCollected).toBe(0)
        expect(outcome.stillThere).toBe(false)
        expect(outcome.eventStillThere, 'deleting a sale should take its calendar event with it').toBe(false)
        expect(errors, errors.join('\n')).toHaveLength(0)
    })

    test('pricing, agency and blacklist edits apply to the local lists', async ({ page }) => {
        const stores = await demoStores(page)
        const errors = watchForFirestoreErrors(page)

        const outcome = await page.evaluate(async (hotelId) => {
            const S = window.__relayStores!
            const pricing = S.usePricingStore.getState()

            await pricing.setBasePrices(hotelId, { standard: { amount: 120, currency: 'EUR' } } as any, 'demo-user-gm')
            const baseAfterSet = S.usePricingStore.getState().basePrices

            const agencyId = await pricing.addAgency(hotelId, 'Demo Travel')
            const agencyAfterAdd = S.usePricingStore.getState().agencies.find((a: any) => a.id === agencyId)

            await pricing.updateAgencyBasePrices(hotelId, agencyId, { deluxe: { amount: 200, currency: 'EUR' } } as any)
            const agencyAfterPrices = S.usePricingStore.getState().agencies.find((a: any) => a.id === agencyId)

            await pricing.removeAgency(hotelId, agencyId)
            const agencyAfterRemove = S.usePricingStore.getState().agencies.some((a: any) => a.id === agencyId)

            const blacklist = S.useBlacklistStore.getState()
            await blacklist.addBlacklistedGuest(hotelId, {
                guest_name: 'Demo Guest', room_number: '101', reason: 'Demo reason',
            } as any)
            const blacklistedAfterAdd = S.useBlacklistStore.getState().blacklistedGuests

            const addedGuest = blacklistedAfterAdd[0]
            await S.useBlacklistStore.getState().removeBlacklistedGuest(hotelId, addedGuest.id)
            const blacklistAfterRemove = S.useBlacklistStore.getState().blacklistedGuests

            return {
                baseAmount: baseAfterSet?.prices?.standard?.amount,
                agencyName: agencyAfterAdd?.name,
                agencyBaseAmount: agencyAfterPrices?.base_prices?.deluxe?.amount,
                agencyAfterRemove,
                blacklistedCount: blacklistedAfterAdd.length,
                blacklistAfterRemove: blacklistAfterRemove.length,
            }
        }, DEMO_HOTEL)

        expect(outcome.baseAmount).toBe(120)
        expect(outcome.agencyName).toBe('Demo Travel')
        expect(outcome.agencyBaseAmount).toBe(200)
        expect(outcome.agencyAfterRemove).toBe(false)
        expect(outcome.blacklistedCount).toBe(1)
        expect(outcome.blacklistAfterRemove).toBe(0)
        expect(errors, errors.join('\n')).toHaveLength(0)
    })

    test('shift, staff meal, off-day and notification writes all apply locally', async ({ page }) => {
        const stores = await demoStores(page)
        const errors = watchForFirestoreErrors(page)

        const outcome = await page.evaluate(async (hotelId) => {
            const S = window.__relayStores!

            await S.useShiftStore.getState().updateCompliance(hotelId, 'kbs_checked', false)
            const compliance = S.useShiftStore.getState().currentShift?.compliance

            await S.useStaffMealStore.getState().updateMenu(hotelId, 'Demo menu line', 'demo-user-gm', 'Demo Manager')
            const menu = S.useStaffMealStore.getState().todayMenu?.menu

            const offDay = S.useOffDayStore.getState()
            await offDay.submitRequest(hotelId, {
                staff_id: 'demo-user-staff', staff_name: 'Demo Staff',
                date: '2026-03-02', reason: 'Demo reason',
            } as any)
            const requestId = S.useOffDayStore.getState().requests[0]?.id
            await S.useOffDayStore.getState().updateRequestStatus(hotelId, requestId, 'approved', 'demo-user-gm')
            const approved = S.useOffDayStore.getState().requests[0]
            await S.useOffDayStore.getState().deleteRequest(hotelId, requestId)
            const remaining = S.useOffDayStore.getState().requests.length

            await S.useNotificationStore.getState().markAllAsRead(hotelId)
            const unread = S.useNotificationStore.getState().unreadCount

            return {
                kbs: compliance?.kbs_checked,
                menu,
                approvedStatus: approved?.status,
                approvedBy: approved?.processed_by,
                remaining,
                unread,
            }
        }, DEMO_HOTEL)

        expect(outcome.kbs).toBe(false)
        expect(outcome.menu).toBe('Demo menu line')
        expect(outcome.approvedStatus).toBe('approved')
        expect(outcome.approvedBy).toBe('demo-user-gm')
        expect(outcome.remaining).toBe(0)
        expect(outcome.unread).toBe(0)
        expect(errors, errors.join('\n')).toHaveLength(0)
    })

    test('no reachable Firestore write is missing a demo guard', async () => {
        /**
         * The regression net for the whole class of bug. A store action that writes to Firestore,
         * is callable from a component, and has neither a "demo-hotel-id" nor an "is_demo" check
         * will be rejected by the demo at runtime. The four entries allowed below are real auth
         * and onboarding flows, plus a component that is never mounted; each is listed with the
         * reason so a new arrival has to argue for its exemption rather than inherit it.
         */
        const allowed = new Set([
            'hotelStore:joinHotelByCode',              // real onboarding, a demo user already has a hotel
            'hotelStore:validateHotelCode',            // real onboarding
            'hotelStore:createNewHotel',               // real onboarding
            'incidentStore:addIncident',               // only reachable from a modal nothing renders
            'pages/LoginPage',                         // real sign-in page
            'pages/RegisterPage',                      // real registration page
        ])

        const scan = await import('../../scripts/scan-demo-writes.mjs')
        const found: string[] = scan.findUnguardedDemoWrites()

        expect(
            found.filter((entry) => !allowed.has(entry.key)),
            `these Firestore writes have no demo guard:\n${found.map((e) => '  ' + e.location).join('\n')}`,
        ).toEqual([])
    })

})
