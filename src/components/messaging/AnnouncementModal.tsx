import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Megaphone, Undo2 } from 'lucide-react'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAnnouncementFeed } from '@/hooks/useAnnouncementFeed'
import { isRetractionPending, nextUnreadAnnouncement } from '@/lib/announcements'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * The full screen announcement. Opening it records that it was seen; closing it records that it
 * was dismissed, which is what the management view counts. A withdrawn announcement the reader had
 * already opened opens too, as a retraction to acknowledge rather than content to read.
 */
export function AnnouncementModal() {
    useAnnouncementFeed()
    const { t, language } = useLanguageStore()
    const user = useAuthStore((state) => state.user)
    const storeHotelId = useHotelStore((state) => state.hotel?.id)
    const hotelId = user?.is_demo ? 'demo-hotel-id' : (user?.hotel_id || storeHotelId)
    const notifications = useNotificationStore((state) => state.notifications)
    const markNotificationAsRead = useNotificationStore((state) => state.markAsRead)
    const updateSettings = useAuthStore((state) => state.updateSettings)
    const { announcements, receipts, receiptsLoaded, markSeen, markDismissed, acknowledgeRecall } = useAnnouncementStore()
    const [currentId, setCurrentId] = useState<string | null>(null)
    const [dismissedSession, setDismissedSession] = useState<Set<string>>(new Set())
    const [acknowledgedSession, setAcknowledgedSession] = useState<Set<string>>(new Set())
    const openedRef = useRef<string | null>(null)

    const dismissedSettings = useMemo(() => user?.settings?.dismissed_announcements || [], [user?.settings?.dismissed_announcements])

    const mergedReceipts = useMemo(() => {
        if (dismissedSession.size === 0) return receipts
        const copy = { ...receipts }
        for (const id of dismissedSession) {
            copy[id] = {
                announcementId: id,
                uid: user?.uid || '',
                state: 'dismissed',
                seenAt: copy[id]?.seenAt || new Date(),
                dismissedAt: new Date(),
                recalledAckAt: copy[id]?.recalledAckAt || (acknowledgedSession.has(id) ? new Date() : undefined),
            }
        }
        return copy
    }, [receipts, dismissedSession, acknowledgedSession, user?.uid])

    const candidate = useMemo(() => {
        if (!receiptsLoaded) return null
        return nextUnreadAnnouncement(announcements, mergedReceipts, { uid: user?.uid, role: user?.role })
    }, [announcements, mergedReceipts, user?.uid, user?.role, receiptsLoaded])

    // Announcements published before this feature shipped live on as notifications. They are shown
    // once so nobody misses them, but they have no read receipt and cannot be withdrawn.
    const legacy = useMemo(
        () => notifications
            .filter((entry) => entry.type === 'announcement' && !entry.is_read && !dismissedSettings.includes(entry.id))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null,
        [notifications, dismissedSettings],
    )

    // The open announcement is latched rather than recomputed. Recording the seen receipt makes
    // the candidate unread no more, and a recomputed choice would close the dialog under the
    // reader the instant it appeared.
    useEffect(() => {
        if (!currentId && candidate) setCurrentId(candidate.id)
    }, [currentId, candidate])

    const announcement = useMemo(
        () => announcements.find((item) => item.id === currentId) || null,
        [announcements, currentId],
    )

    // An already dismissed announcement can still need a withdrawal acknowledgement.
    useEffect(() => {
        if (currentId && receipts[currentId]?.state === 'dismissed' &&
            (!announcement || !isRetractionPending(announcement, receipts[currentId]))) {
            setCurrentId(null)
        }
    }, [currentId, receipts, announcement])

    const retraction = announcement ? isRetractionPending(announcement, receipts[announcement.id]) : false
    const open = announcement !== null || legacy !== null

    // Acknowledging a withdrawal from somewhere else, such as the banner, must also take the
    // dialog down. Without this it would keep showing content that has been retracted.
    useEffect(() => {
        if (currentId && announcement?.recalledAt && !retraction) setCurrentId(null)
    }, [currentId, announcement, retraction])

    useEffect(() => {
        // Seen is recorded as soon as the dialog renders, not when it is closed. A retraction is
        // exempt: this reader had already opened the announcement, and rewriting seenAt would
        // overwrite when they originally read it.
        if (!announcement || !hotelId || !user?.uid || retraction) return
        if (openedRef.current === announcement.id) return
        openedRef.current = announcement.id
        void markSeen(hotelId, announcement.id, user.uid)
    }, [announcement, hotelId, user?.uid, retraction, markSeen])

    // Dismissing a retraction acknowledges it, so it cannot be escaped without being read and
    // cannot come back on the next page load.
    const close = () => {
        if (announcement && hotelId && user?.uid) {
            const id = announcement.id
            setDismissedSession((prev) => new Set(prev).add(id))
            if (retraction) setAcknowledgedSession((prev) => new Set(prev).add(id))
            setCurrentId(null)
            if (retraction) void acknowledgeRecall(hotelId, id, user.uid)
            else void markDismissed(hotelId, id, user.uid)
            return
        }
        if (legacy && hotelId) {
            void markNotificationAsRead(hotelId, legacy.id)
            void updateSettings({ dismissed_announcements: [...dismissedSettings, legacy.id] })
        }
    }

    const pick = (tr: string, ru: string, en: string) => (language === 'tr' ? tr : language === 'ru' ? ru : en)
    const label = retraction
        ? t('announcement.withdrawn')
        : pick('Yönetim duyurusu', 'Объявление руководства', 'Management announcement')
    const understood = retraction
        ? pick('Anladım', 'Понятно', 'Understood')
        : pick('Okudum, kapat', 'Прочитано, закрыть', 'I have read this')
    // A retraction never shows the original text: the reader is being told to disregard it, and
    // repeating it invites them to act on a stale copy.
    const title = retraction
        ? (announcement?.title || t('announcement.withdrawn'))
        : announcement ? announcement.title || announcement.createdByName : legacy?.title
    const content = retraction
        ? t('announcement.retractionBody', {
            name: announcement?.recalledByName || announcement?.createdByName || '',
        }).trim()
        : announcement ? announcement.content : legacy?.content || ''

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) close() }}>
            {(announcement || legacy) && (
                <DialogContent className="grid h-[min(90dvh,52rem)] w-[min(94vw,72rem)] max-w-none grid-rows-[auto_1fr_auto] overflow-hidden p-0" data-testid="announcement-modal" data-retraction={retraction ? 'true' : 'false'}>
                    <DialogHeader className="border-b border-border px-7 py-6 pr-16">
                        <div className="flex items-start gap-4">
                            <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', retraction ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                                {retraction ? <Undo2 className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
                            </div>
                            <div className="min-w-0">
                                <DialogDescription className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                                    {retraction ? <Undo2 className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}{label}
                                </DialogDescription>
                                <DialogTitle className="text-2xl sm:text-3xl">{title}</DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="min-h-0 overflow-y-auto px-7 py-8 sm:px-10">
                        <p className="mx-auto max-w-4xl text-base leading-8 whitespace-pre-wrap text-foreground sm:text-lg">{content}</p>
                    </div>
                    <DialogFooter className="border-t border-border bg-muted/20 px-7 py-4">
                        <Button className="min-w-44" onClick={close}>{understood}</Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    )
}
