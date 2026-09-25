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
 * How long a reader is reminded that an announcement they had read was withdrawn. The reminder has
 * to be finite: an announcement nobody acknowledges would otherwise be raised forever. What stops
 * reminding is a reminder, not the correction itself, so the manager is left holding the list of
 * who never acknowledged, and the record of what they read stays intact either way.
 */
export const RECALL_ACK_WINDOW_MS = 1000 * 60 * 60 * 72

/**
 * True once the reminder window has closed, meaning the manager can no longer rely on the reader
 * finding out on their own.
 */
export function isRecallAckExpired(announcement: Announcement, now = Date.now()) {
    if (!isAnnouncementWithdrawn(announcement)) return false
    return (announcement.recalledAt?.getTime() || 0) + RECALL_ACK_WINDOW_MS <= now
}

/**
 * A reader who had already opened an announcement must be told it was withdrawn, and stays owed
 * that notice until they acknowledge it or the reminder window closes. A retraction that quietly
 * expires on its own is worse than no retraction at all: the person keeps acting on an instruction
 * that no longer stands.
 */
export function isRetractionPending(announcement: Announcement, receipt?: AnnouncementReceipt, now = Date.now()) {
    if (!isAnnouncementWithdrawn(announcement) || !receipt || receipt.recalledAckAt) return false
    return !isRecallAckExpired(announcement, now)
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
    /**
     * Of the people who had already read it, how many have acknowledged the withdrawal. Only
     * meaningful once the announcement is withdrawn.
     */
    toldRetraction: number
    /** The ones who read it and have not been told yet, so management can go and tell them. */
    untoldRetraction: AudienceEntry[]
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
    const summary: AudienceSummary = {
        pending: [], seen: [], dismissed: [], total: 0, toldRetraction: 0, untoldRetraction: [],
    }
    const counted = new Set<string>()
    // Only a withdrawal produces a correction to acknowledge, so a live announcement has none.
    const withdrawn = isAnnouncementWithdrawn(announcement)
    const acknowledge = (uid: string, name: string, receipt: AnnouncementReceipt | undefined, at?: Date) => {
        if (!withdrawn || !receipt) return
        if (receipt.recalledAckAt) summary.toldRetraction += 1
        else summary.untoldRetraction.push({ uid, name, at })
    }

    for (const uid of expected) {
        counted.add(uid)
        const receipt = receipts[uid]
        if (receipt?.state === 'dismissed') {
            summary.dismissed.push({ uid, name: name(uid), at: receipt.dismissedAt })
            acknowledge(uid, name(uid), receipt, receipt.dismissedAt)
        } else if (receipt) {
            summary.seen.push({ uid, name: name(uid), at: receipt.seenAt })
            acknowledge(uid, name(uid), receipt, receipt.seenAt)
        } else {
            summary.pending.push({ uid, name: name(uid) })
        }
    }

    for (const [uid, receipt] of Object.entries(receipts)) {
        if (counted.has(uid)) continue
        const entry = { uid, name: name(uid), at: receipt.dismissedAt || receipt.seenAt }
        if (receipt.state === 'dismissed') summary.dismissed.push(entry)
        else summary.seen.push(entry)
        acknowledge(uid, entry.name, receipt, entry.at)
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
