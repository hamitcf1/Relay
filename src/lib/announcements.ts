import type { Announcement, AnnouncementReceipt, StaffMember } from '@/types'

/** An announcement is addressed either to the whole active team or to a named subset. */
export function expectedRecipients(announcement: Announcement, staff: StaffMember[] = []) {
    if (announcement.audience === 'selected') return announcement.recipientIds || []
    return staff
        .filter((member) => member.uid !== announcement.createdBy && member.status !== 'inactive')
        .map((member) => member.uid)
}

/**
 * Recalled announcements are withdrawn from everyone but stay visible to their author,
 * so the author can see what they pulled back and restore it if it was a mistake.
 */
export function isAnnouncementWithdrawn(announcement: Announcement) {
    return Boolean(announcement.recalledAt)
}

export function isReceiptUnread(receipt?: AnnouncementReceipt) {
    return !receipt
}

export function isAnnouncementVisibleTo(announcement: Announcement, viewer: { uid?: string; role?: string }) {
    if (!isAnnouncementWithdrawn(announcement)) return true
    return announcement.createdBy === viewer.uid || viewer.role === 'gm'
}

export function isAddressedTo(announcement: Announcement, viewer: { uid?: string }) {
    if (!viewer.uid) return false
    if (announcement.audience === 'all') return true
    return (announcement.recipientIds || []).includes(viewer.uid)
}

/**
 * A reader who had already opened an announcement must be told it was withdrawn, and stays owed
 * that notice until they acknowledge it. A retraction that quietly expires is worse than no
 * retraction at all: the person keeps acting on an instruction that no longer stands.
 */
export function isRetractionPending(announcement: Announcement, receipt?: AnnouncementReceipt) {
    return isAnnouncementWithdrawn(announcement) && Boolean(receipt) && !receipt?.recalledAckAt
}

/** Withdrawn announcements this reader still has to be told about, most recent recall first. */
export function pendingRetractions(
    announcements: Announcement[],
    receipts: Record<string, AnnouncementReceipt>,
    viewer: { uid?: string; role?: string },
) {
    return announcements
        .filter((announcement) => announcement.createdBy !== viewer.uid)
        .filter((announcement) => isAddressedTo(announcement, viewer))
        .filter((announcement) => isRetractionPending(announcement, receipts[announcement.id]))
        .sort((a, b) => (b.recalledAt?.getTime() || 0) - (a.recalledAt?.getTime() || 0))
}

export interface AudienceEntry {
    uid: string
    name: string
    at?: Date
}

export interface AudienceSummary {
    pending: AudienceEntry[]
    seen: AudienceEntry[]
    dismissed: AudienceEntry[]
    total: number
    /** Of the people who had already read it, how many have acknowledged the withdrawal. */
    toldRetraction: number
}

/**
 * Splits an announcement's audience into who has not opened it, who opened it and who closed it.
 * Receipts from accounts that are no longer in the audience still count, otherwise a role change
 * could silently erase the record of someone who genuinely read it.
 */
export function getAudienceSummary(
    announcement: Announcement,
    receipts: Record<string, AnnouncementReceipt> = {},
    staff: StaffMember[] = [],
): AudienceSummary {
    const expected = expectedRecipients(announcement, staff)
    const nameById = new Map(staff.map((member) => [member.uid, member.name]))
    const name = (uid: string) => nameById.get(uid) || uid
    const summary: AudienceSummary = { pending: [], seen: [], dismissed: [], total: 0, toldRetraction: 0 }
    const counted = new Set<string>()
    const tallyRetraction = (receipt: AnnouncementReceipt | undefined) => {
        if (receipt?.recalledAckAt) summary.toldRetraction += 1
    }

    for (const uid of expected) {
        counted.add(uid)
        const receipt = receipts[uid]
        tallyRetraction(receipt)
        if (receipt?.state === 'dismissed') summary.dismissed.push({ uid, name: name(uid), at: receipt.dismissedAt })
        else if (receipt) summary.seen.push({ uid, name: name(uid), at: receipt.seenAt })
        else summary.pending.push({ uid, name: name(uid) })
    }

    for (const [uid, receipt] of Object.entries(receipts)) {
        if (counted.has(uid)) continue
        tallyRetraction(receipt)
        const entry = { uid, name: name(uid), at: receipt.dismissedAt || receipt.seenAt }
        if (receipt.state === 'dismissed') summary.dismissed.push(entry)
        else summary.seen.push(entry)
    }

    summary.total = summary.pending.length + summary.seen.length + summary.dismissed.length
    return summary
}

/**
 * The announcement a reader should be shown next.
 *
 * A pending retraction comes first even when a newer announcement exists: it is not new
 * information but a correction telling the reader to stop acting on something they already acted
 * on, and that should not have to queue behind a menu change.
 */
export function nextUnreadAnnouncement(
    announcements: Announcement[],
    receipts: Record<string, AnnouncementReceipt>,
    viewer: { uid?: string; role?: string },
) {
    const retraction = pendingRetractions(announcements, receipts, viewer)[0]
    if (retraction) return retraction

    return announcements
        // Nobody is nagged about an announcement they wrote themselves.
        .filter((announcement) => announcement.createdBy !== viewer.uid)
        .filter((announcement) => isAddressedTo(announcement, viewer))
        .filter((announcement) => !isAnnouncementWithdrawn(announcement))
        .filter((announcement) => isReceiptUnread(receipts[announcement.id]))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
}

/** Recent announcements worth surfacing as a banner for a reader. */
export function bannerAnnouncements(
    announcements: Announcement[],
    receipts: Record<string, AnnouncementReceipt>,
    viewer: { uid?: string; role?: string },
    withinMs: number,
    limit = 3,
) {
    const cutoff = Date.now() - withinMs
    return announcements
        .filter((announcement) => announcement.createdBy !== viewer.uid)
        .filter((announcement) => isAddressedTo(announcement, viewer))
        .filter((announcement) => announcement.createdAt.getTime() >= cutoff)
        .filter((announcement) => !isAnnouncementWithdrawn(announcement))
        .filter((announcement) => receipts[announcement.id]?.state !== 'dismissed')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
}
