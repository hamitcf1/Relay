import { expect, test } from '@playwright/test'
import {
  bannerAnnouncements,
  expectedRecipients,
  getAudienceSummary,
  isAddressedTo,
  isAnnouncementVisibleTo,
  isRetractionPending,
  nextUnreadAnnouncement,
  pendingRetractions,
} from '../../src/lib/announcements'
import type { Announcement, AnnouncementReceipt, StaffMember } from '../../src/types'

const minutesAgo = (n: number) => new Date(Date.now() - 1000 * 60 * n)
const hoursAgo = (n: number) => new Date(Date.now() - 1000 * 60 * 60 * n)

const staff: StaffMember[] = [
  { uid: 'gm', name: 'Manager', role: 'gm', status: 'active' },
  { uid: 'a', name: 'Ayşe', role: 'receptionist', status: 'active' },
  { uid: 'b', name: 'Bora', role: 'receptionist', status: 'active' },
  { uid: 'c', name: 'Ceren', role: 'receptionist', status: 'active' },
  { uid: 'gone', name: 'Ayrılan', role: 'receptionist', status: 'inactive' },
]

const announcement = (over: Partial<Announcement> = {}): Announcement => ({
  id: 'ann-1',
  content: 'Lütfen yeni prosedürü okuyun.',
  audience: 'all',
  createdBy: 'gm',
  createdByName: 'Manager',
  createdAt: hoursAgo(1),
  recalledAt: null,
  ...over,
})

const receipt = (over: Partial<AnnouncementReceipt> = {}): AnnouncementReceipt => ({
  announcementId: 'ann-1',
  uid: 'a',
  state: 'seen',
  seenAt: minutesAgo(10),
  ...over,
})

test.describe('who an announcement is addressed to', () => {
  test('an all-staff announcement reaches every active account except the author', () => {
    expect(expectedRecipients(announcement(), staff)).toEqual(['a', 'b', 'c'])
  })

  test('a targeted announcement reaches only the named accounts', () => {
    const targeted = announcement({ audience: 'selected', recipientIds: ['b'], recipientNames: ['Bora'] })
    expect(expectedRecipients(targeted, staff)).toEqual(['b'])
    expect(isAddressedTo(targeted, { uid: 'b' })).toBe(true)
    expect(isAddressedTo(targeted, { uid: 'a' })).toBe(false)
  })

  test('an all-staff announcement reaches everyone addressed, author included', () => {
    expect(isAddressedTo(announcement(), { uid: 'gm' })).toBe(true)
    expect(isAddressedTo(announcement(), { uid: 'a' })).toBe(true)
  })
})

test.describe('read receipts are per person', () => {
  test('splits the audience into pending, seen and dismissed', () => {
    const summary = getAudienceSummary(announcement(), {
      a: receipt({ state: 'dismissed', dismissedAt: minutesAgo(5) }),
      b: receipt({ seenAt: minutesAgo(20) }),
    }, staff)

    expect(summary.pending.map((entry) => entry.uid)).toEqual(['c'])
    expect(summary.seen.map((entry) => entry.uid)).toEqual(['b'])
    expect(summary.dismissed.map((entry) => entry.uid)).toEqual(['a'])
    expect(summary.total).toBe(3)
  })

  test('keeps the timestamp each state was reached at', () => {
    const seenAt = minutesAgo(20)
    const dismissedAt = minutesAgo(5)
    const summary = getAudienceSummary(announcement(), {
      a: receipt({ state: 'dismissed', seenAt, dismissedAt }),
      b: receipt({ seenAt }),
    }, staff)

    expect(summary.dismissed[0]).toEqual({ uid: 'a', name: 'Ayşe', at: dismissedAt })
    expect(summary.seen[0]).toEqual({ uid: 'b', name: 'Bora', at: seenAt })
    expect(summary.pending[0].at).toBeUndefined()
  })

  test('one person reading never marks the announcement read for anyone else', () => {
    const first = getAudienceSummary(announcement(), { a: receipt() }, staff)
    expect(first.seen).toHaveLength(1)
    expect(first.pending).toHaveLength(2)
  })

  test('counts a receipt from someone who has since left the audience', () => {
    const summary = getAudienceSummary(announcement(), { gone: receipt({ uid: 'gone' }) }, staff)
    expect(summary.seen.map((entry) => entry.uid)).toEqual(['gone'])
    expect(summary.pending.map((entry) => entry.uid)).toEqual(['a', 'b', 'c'])
    expect(summary.total).toBe(4)
  })
})

test.describe('withdrawing an announcement', () => {
  const recalled = announcement({ recalledAt: minutesAgo(1), recalledByName: 'Manager' })

  test('hides it from recipients but keeps it for its author and for managers', () => {
    expect(isAnnouncementVisibleTo(recalled, { uid: 'a', role: 'receptionist' })).toBe(false)
    expect(isAnnouncementVisibleTo(recalled, { uid: 'gm', role: 'gm' })).toBe(true)
    expect(isAnnouncementVisibleTo(recalled, { uid: 'gm' })).toBe(true)
  })

  test('stops it interrupting readers who had not opened it', () => {
    expect(nextUnreadAnnouncement([recalled], {}, { uid: 'a', role: 'receptionist' })).toBeUndefined()
    expect(isRetractionPending(recalled, undefined)).toBe(false)
  })

  test('leaves the record intact for the management view', () => {
    const summary = getAudienceSummary(recalled, { a: receipt() }, staff)
    expect(summary.seen.map((entry) => entry.uid)).toEqual(['a'])
  })
})

test.describe('telling a reader their announcement was withdrawn', () => {
  const recalled = announcement({ recalledAt: minutesAgo(1), recalledByName: 'Manager' })
  const read = { [recalled.id]: receipt({ state: 'dismissed' }) }
  const acknowledged = { [recalled.id]: receipt({ state: 'dismissed', recalledAckAt: minutesAgo(1) }) }

  test('owes a notice to someone who read it and has not acknowledged the withdrawal', () => {
    expect(isRetractionPending(recalled, receipt({ state: 'dismissed' }))).toBe(true)
  })

  test('stops owing it once the reader acknowledges, and never repeats it', () => {
    expect(isRetractionPending(recalled, receipt({ recalledAckAt: minutesAgo(1) }))).toBe(false)
    expect(nextUnreadAnnouncement([recalled], acknowledged, { uid: 'a' })).toBeUndefined()
  })

  test('interrupts the reader, and does so ahead of a newer announcement', () => {
    // The retraction corrects something already acted on, so it outranks new information.
    const newer = announcement({ id: 'new', createdAt: new Date() })
    expect(nextUnreadAnnouncement([newer, recalled], read, { uid: 'a' })?.id).toBe(recalled.id)
  })

  test('keeps reminding for as long as it is unacknowledged, with no expiry', () => {
    const longAgo = announcement({ recalledAt: hoursAgo(400) })
    const stale = { [longAgo.id]: receipt({ recalledAckAt: undefined }) }
    expect(pendingRetractions([longAgo], stale, { uid: 'a' }).map((item) => item.id)).toEqual([longAgo.id])
    // A fresh announcement is only a banner for a day; a withdrawal cannot be allowed to lapse.
    expect(bannerAnnouncements([longAgo], stale, { uid: 'a' }, 1000 * 60 * 60 * 24)).toHaveLength(0)
  })

  test('does not tell someone who never read the announcement that they read it', () => {
    expect(pendingRetractions([recalled], {}, { uid: 'b' })).toEqual([])
  })

  test('does not tell its own author', () => {
    expect(pendingRetractions([recalled], { [recalled.id]: receipt({ uid: 'gm' }) }, { uid: 'gm' })).toEqual([])
  })

  test('leaves the original read time alone, so the audit still shows when it was read', () => {
    const seenAt = hoursAgo(5)
    const summary = getAudienceSummary(recalled, { a: receipt({ state: 'dismissed', seenAt, recalledAckAt: minutesAgo(1) }) }, staff)
    expect(summary.dismissed[0].at).not.toEqual(seenAt)
    expect(summary.toldRetraction).toBe(1)
  })

  test('reports how far the correction has got, out of everyone who had read it', () => {
    const partway = getAudienceSummary(recalled, {
      a: receipt({ uid: 'a', recalledAckAt: minutesAgo(1) }),
      b: receipt({ uid: 'b' }),
    }, staff)
    expect(partway.toldRetraction).toBe(1)
    expect(partway.seen.length + partway.dismissed.length).toBe(2)
  })

  test('counts nobody as told when the announcement is still live', () => {
    expect(getAudienceSummary(announcement(), { a: receipt() }, staff).toldRetraction).toBe(0)
  })
})

test.describe('what a reader is shown', () => {
  test('surfaces the newest announcement they have not opened', () => {
    const older = announcement({ id: 'old', createdAt: hoursAgo(5) })
    const newer = announcement({ id: 'new', createdAt: hoursAgo(1) })
    expect(nextUnreadAnnouncement([older, newer], {}, { uid: 'a' })?.id).toBe('new')
  })

  test('never nags about an announcement they wrote themselves', () => {
    expect(nextUnreadAnnouncement([announcement()], {}, { uid: 'gm' })).toBeUndefined()
  })

  test('stops asking once it has been closed, but still counts as seen while open', () => {
    const open = announcement()
    expect(nextUnreadAnnouncement([open], { [open.id]: receipt({ state: 'seen' }) }, { uid: 'a' })).toBeUndefined()

    const closed = announcement()
    expect(nextUnreadAnnouncement([closed], { [closed.id]: receipt({ state: 'dismissed' }) }, { uid: 'a' })).toBeUndefined()
  })

  test('shows recent announcements as a banner and drops old or closed ones', () => {
    const recent = announcement({ id: 'recent', createdAt: hoursAgo(1) })
    const old = announcement({ id: 'old', createdAt: hoursAgo(30) })
    const closed = announcement({ id: 'closed', createdAt: hoursAgo(2) })
    const receipts = { closed: receipt({ state: 'dismissed' }) }

    const shown = bannerAnnouncements([recent, old, closed], receipts, { uid: 'a' }, 1000 * 60 * 60 * 24)
    expect(shown.map((item) => item.id)).toEqual(['recent'])
  })

  test('caps the banner at three entries', () => {
    const many = [1, 2, 3, 4, 5].map((n) => announcement({ id: `a${n}`, createdAt: minutesAgo(n) }))
    expect(bannerAnnouncements(many, {}, { uid: 'a' }, 1000 * 60 * 60 * 24)).toHaveLength(3)
  })
})
