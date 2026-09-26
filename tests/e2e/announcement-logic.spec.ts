import { test, expect } from '@playwright/test'

import {
    UNREAD_PROMPT_MAX_AGE_MS,
    bannerAnnouncements,
    getAudienceSummary,
    nextUnreadAnnouncement,
    pendingRetractions,
} from '../../src/lib/announcements'
import type { Announcement, AnnouncementReceipt, StaffMember } from '../../src/types'

/**
 * These cover the announcement decisions that were wrong in ways no test could see, because the
 * whole read receipt feature was silently dead in production: the store never received a
 * receipt, so every announcement looked unread to every person, the read receipt report always
 * showed zero, and the withdrawal notice never appeared. The demo path is a separate in memory
 * implementation that worked, which is exactly why the bug survived.
 */

const HOUR = 1000 * 60 * 60
const DAY = 24 * HOUR

const staffMember = (uid: string, name: string, status: StaffMember['status'] = 'active'): StaffMember =>
    ({ uid, name, status } as StaffMember)

const announcement = (over: Partial<Announcement> & { id: string }): Announcement => ({
    title: undefined,
    content: 'x',
    audience: 'all',
    createdBy: 'gm',
    createdByName: 'GM',
    createdAt: new Date(0),
    recalledAt: null,
    ...over,
})

const receipt = (over: Partial<AnnouncementReceipt> & { announcementId: string; uid: string }): AnnouncementReceipt => ({
    state: 'seen',
    seenAt: new Date(0),
    ...over,
})

// --- The modal should not interrupt for something old -----------------------------------------

test.describe('nextUnreadAnnouncement', () => {
    const viewer = { uid: 'staffer', role: 'receptionist' }
    const now = new Date('2026-03-01T12:00:00Z').getTime()

    test('offers an unread announcement from today', () => {
        const today = announcement({ id: 'a1', createdAt: new Date(now - 2 * HOUR) })
        expect(nextUnreadAnnouncement([today], {}, viewer, now)?.id).toBe('a1')
    })

    test('leaves an ancient unread announcement alone, because the modal blocks the dashboard', () => {
        // Eight months old and never opened. Interrupting the shift for this is how people learn
        // to dismiss the modal without reading, which then costs us the announcements that matter.
        const ancient = announcement({ id: 'old', createdAt: new Date(now - 240 * DAY) })
        expect(nextUnreadAnnouncement([ancient], {}, viewer, now)).toBeUndefined()
    })

    test('the age limit is a boundary, not an approximation', () => {
        const justInside = announcement({ id: 'in', createdAt: new Date(now - UNREAD_PROMPT_MAX_AGE_MS + 60_000) })
        const justOutside = announcement({ id: 'out', createdAt: new Date(now - UNREAD_PROMPT_MAX_AGE_MS - 60_000) })

        expect(nextUnreadAnnouncement([justInside], {}, viewer, now)?.id).toBe('in')
        expect(nextUnreadAnnouncement([justOutside], {}, viewer, now)).toBeUndefined()
    })

    test('an old withdrawal still interrupts, because a correction is the opposite of a routine notice', () => {
        // The whole point of the age limit is to stop routine nagging. A retraction is the case
        // where being left alone is expensive, so it is exempt and comes first regardless of age.
        const oldAndWithdrawn = announcement({
            id: 'w1',
            createdAt: new Date(now - 300 * DAY),
            recalledAt: new Date(now - 2 * HOUR),
            recalledByName: 'GM',
        })
        const receipts = { w1: receipt({ announcementId: 'w1', uid: 'staffer' }) }

        expect(nextUnreadAnnouncement([oldAndWithdrawn], receipts, viewer, now)?.id).toBe('w1')
    })

    test('never nags the person who wrote it', () => {
        const own = announcement({ id: 'mine', createdBy: 'staffer', createdAt: new Date(now - HOUR) })
        expect(nextUnreadAnnouncement([own], {}, { uid: 'staffer' }, now)).toBeUndefined()
    })

    test('does not nag someone outside a named audience', () => {
        const selected = announcement({ id: 's1', audience: 'selected', recipientIds: ['someone-else'] })
        expect(nextUnreadAnnouncement([selected], {}, viewer, now)).toBeUndefined()
    })

    test('picks the newest of several unread', () => {
        const older = announcement({ id: 'older', createdAt: new Date(now - 5 * HOUR) })
        const newer = announcement({ id: 'newer', createdAt: new Date(now - HOUR) })
        expect(nextUnreadAnnouncement([older, newer], {}, viewer, now)?.id).toBe('newer')
    })
})

// --- Withdrawals ------------------------------------------------------------------------------

test.describe('pendingRetractions', () => {
    const viewer = { uid: 'staffer', role: 'receptionist' }
    const now = new Date('2026-03-01T12:00:00Z').getTime()

    const withdrawn = (over: Partial<Announcement> & { id: string }) => announcement({
        createdAt: new Date(now - 30 * DAY),
        recalledAt: new Date(now - 2 * HOUR),
        recalledByName: 'GM',
        ...over,
    })

    test('a reader who saw it and has not acknowledged still owes the notice', () => {
        const w = withdrawn({ id: 'w1' })
        const receipts = { w1: receipt({ announcementId: 'w1', uid: 'staffer' }) }
        expect(pendingRetractions([w], receipts, viewer, now).map((i) => i.id)).toEqual(['w1'])
    })

    test('acknowledging it clears the notice', () => {
        const w = withdrawn({ id: 'w1' })
        const receipts = {
            w1: receipt({ announcementId: 'w1', uid: 'staffer', recalledAckAt: new Date(now - HOUR) }),
        }
        expect(pendingRetractions([w], receipts, viewer, now)).toEqual([])
    })

    test('someone who never read it is not nagged, there is nothing to correct', () => {
        const w = withdrawn({ id: 'w1' })
        expect(pendingRetractions([w], {}, viewer, now)).toEqual([])
    })

    test('the reminder window closes, so a manager is not followed forever', () => {
        const staleRecall = announcement({
            id: 'w2',
            createdAt: new Date(now - 30 * DAY),
            recalledAt: new Date(now - 10 * DAY),
            recalledByName: 'GM',
        })
        const receipts = { w2: receipt({ announcementId: 'w2', uid: 'staffer' }) }
        expect(pendingRetractions([staleRecall], receipts, viewer, now)).toEqual([])
    })

    test('most recent recall comes first', () => {
        const older = withdrawn({ id: 'older', recalledAt: new Date(now - 20 * HOUR) })
        const newer = withdrawn({ id: 'newer', recalledAt: new Date(now - 1 * HOUR) })
        const receipts = {
            older: receipt({ announcementId: 'older', uid: 'staffer' }),
            newer: receipt({ announcementId: 'newer', uid: 'staffer' }),
        }
        expect(pendingRetractions([older, newer], receipts, viewer, now).map((i) => i.id)).toEqual(['newer', 'older'])
    })
})

// --- The read receipt report -------------------------------------------------------------------

test.describe('getAudienceSummary', () => {
    const staff = [staffMember('gm', 'Manager'), staffMember('a', 'Ayse'), staffMember('b', 'Baris'), staffMember('off', 'Zeynep', 'inactive')]
    const now = new Date('2026-03-01T12:00:00Z').getTime()

    test('counts who read, who closed and who has not', () => {
        const a = announcement({ id: 'a1' })
        const receipts = {
            a: receipt({ announcementId: 'a1', uid: 'a', state: 'dismissed' }),
            b: receipt({ announcementId: 'a1', uid: 'b' }),
        }
        const summary = getAudienceSummary(a, receipts, staff)

        expect(summary.total).toBe(2)
        expect(summary.dismissed.map((e) => e.uid)).toEqual(['a'])
        expect(summary.seen.map((e) => e.uid)).toEqual(['b'])
        expect(summary.pending.map((e) => e.uid)).toEqual([])
    })

    test('someone who has left the hotel is not chased as an unread reader', () => {
        // An inactive account is outside the audience by definition. Counting them as pending
        // would leave a permanent unread entry that no one can ever clear, which trains a manager
        // to ignore the number.
        const a = announcement({ id: 'a1' })
        const summary = getAudienceSummary(a, {}, staff)

        expect(summary.pending.map((e) => e.uid)).toEqual(['a', 'b'])
        expect(summary.pending.map((e) => e.uid)).not.toContain('off')
        expect(summary.total).toBe(2)
    })

    test('the author is not their own audience', () => {
        const a = announcement({ id: 'a1', createdBy: 'gm' })
        const summary = getAudienceSummary(a, {}, staff)

        expect(summary.pending.map((e) => e.uid)).toEqual(['a', 'b'])
    })

    test('names the people a withdrawal never reached', () => {
        const w = announcement({ id: 'w1', recalledAt: new Date(now - HOUR) })
        const receipts = {
            a: receipt({ announcementId: 'w1', uid: 'a', recalledAckAt: new Date(now) }),
            b: receipt({ announcementId: 'w1', uid: 'b' }),
        }
        const summary = getAudienceSummary(w, receipts, staff)

        expect(summary.toldRetraction).toBe(1)
        expect(summary.untoldRetraction.map((e) => e.uid)).toEqual(['b'])
    })

    test('a live announcement has no retraction to acknowledge', () => {
        const a = announcement({ id: 'a1' })
        const receipts = { a: receipt({ announcementId: 'a1', uid: 'a' }) }
        const summary = getAudienceSummary(a, receipts, staff)

        expect(summary.toldRetraction).toBe(0)
        expect(summary.untoldRetraction).toEqual([])
    })

    test('someone removed from the audience still counts, rather than vanishing from the record', () => {
        // Otherwise a role change would silently erase the fact that someone genuinely read it.
        const a = announcement({ id: 'a1', audience: 'selected', recipientIds: ['a'] })
        const receipts = { b: receipt({ announcementId: 'a1', uid: 'b' }) }
        const summary = getAudienceSummary(a, receipts, staff)

        expect(summary.seen.map((e) => e.uid)).toEqual(['b'])
        expect(summary.total).toBe(2)
    })

    test('a named audience ignores the rest of the staff', () => {
        const a = announcement({ id: 'a1', audience: 'selected', recipientIds: ['a', 'b'] })
        const summary = getAudienceSummary(a, {}, staff)
        expect(summary.total).toBe(2)
    })
})

// --- The banner -------------------------------------------------------------------------------

test.describe('bannerAnnouncements', () => {
    const viewer = { uid: 'staffer', role: 'receptionist' }
    const now = new Date('2026-03-01T12:00:00Z').getTime()

    test('keeps announcements from the last day', () => {
        const fresh = announcement({ id: 'fresh', createdAt: new Date(now - 2 * HOUR) })
        expect(bannerAnnouncements([fresh], {}, viewer, DAY, 3, now).map((a) => a.id)).toEqual(['fresh'])
    })

    test('drops announcements past the window', () => {
        const old = announcement({ id: 'old', createdAt: new Date(now - 3 * DAY) })
        expect(bannerAnnouncements([old], {}, viewer, DAY, 3, now)).toEqual([])
    })

    test('respects the limit, newest first', () => {
        const many = [5, 4, 3, 2, 1].map((n) =>
            announcement({ id: `a${n}`, createdAt: new Date(now - n * HOUR) }),
        )
        expect(bannerAnnouncements(many, {}, viewer, DAY, 2, now).map((a) => a.id)).toEqual(['a1', 'a2'])
    })

    test('a withdrawal never takes banner space, the reader is told separately', () => {
        const w = announcement({ id: 'w', recalledAt: new Date(now - HOUR) })
        expect(bannerAnnouncements([w], {}, viewer, DAY, 3, now)).toEqual([])
    })
})
