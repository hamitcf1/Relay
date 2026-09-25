import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Megaphone } from 'lucide-react'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAnnouncementFeed } from '@/hooks/useAnnouncementFeed'
import { nextUnreadAnnouncement } from '@/lib/announcements'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * The full screen announcement. Opening it records that it was seen; closing it records that it
 * was dismissed, which is what the management view counts. A withdrawn announcement never opens.
 */
export function AnnouncementModal() {
    useAnnouncementFeed()
    const { language } = useLanguageStore()
    const user = useAuthStore((state) => state.user)
    const hotelId = useHotelStore((state) => state.hotel?.id)
    const notifications = useNotificationStore((state) => state.notifications)
    const updateSettings = useAuthStore((state) => state.updateSettings)
    const { announcements, receipts, markSeen, markDismissed } = useAnnouncementStore()
    const [currentId, setCurrentId] = useState<string | null>(null)
    const openedRef = useRef<string | null>(null)

    const dismissedSettings = useMemo(() => user?.settings?.dismissed_announcements || [], [user?.settings?.dismissed_announcements])
    const candidate = useMemo(
        () => nextUnreadAnnouncement(announcements, receipts, { uid: user?.uid, role: user?.role }),
        [announcements, receipts, user?.uid, user?.role],
    )
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
    const withdrawn = Boolean(announcement?.recalledAt)
    const open = announcement ? !withdrawn : legacy !== null

    useEffect(() => {
        // Seen is recorded as soon as the dialog renders, not when it is closed.
        if (!announcement || !hotelId || !user?.uid || withdrawn) return
        if (openedRef.current === announcement.id) return
        openedRef.current = announcement.id
        void markSeen(hotelId, announcement.id, user.uid)
    }, [announcement, hotelId, user?.uid, withdrawn, markSeen])

    const close = () => {
        if (announcement && hotelId && user?.uid) {
            const id = announcement.id
            setCurrentId(null)
            void markDismissed(hotelId, id, user.uid)
            return
        }
        if (legacy) void updateSettings({ dismissed_announcements: [...dismissedSettings, legacy.id] })
    }

    const label = language === 'tr' ? 'Yönetim duyurusu' : language === 'ru' ? 'Объявление руководства' : 'Management announcement'
    const understood = language === 'tr' ? 'Okudum, kapat' : language === 'ru' ? 'Прочитано, закрыть' : 'I have read this'
    const title = announcement ? announcement.title || announcement.createdByName : legacy?.title
    const content = announcement ? announcement.content : legacy?.content || ''

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) close() }}>
            {(announcement || legacy) && (
                <DialogContent className="grid h-[min(90dvh,52rem)] w-[min(94vw,72rem)] max-w-none grid-rows-[auto_1fr_auto] overflow-hidden p-0" data-testid="announcement-modal">
                    <DialogHeader className="border-b border-border px-7 py-6 pr-16">
                        <div className="flex items-start gap-4">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Megaphone className="h-6 w-6" /></div>
                            <div className="min-w-0">
                                <DialogDescription className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Bell className="h-3.5 w-3.5" />{label}</DialogDescription>
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
