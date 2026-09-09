import { useEffect, useState } from 'react'
import { Bell, Megaphone } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AnnouncementModal() {
    const { notifications } = useNotificationStore()
    const { user, updateSettings } = useAuthStore()
    const { language } = useLanguageStore()
    const dismissed = user?.settings?.dismissed_announcements || []
    const announcement = notifications
        .filter(notification => notification.type === 'announcement' && !notification.is_read && !dismissed.includes(notification.id))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => setIsVisible(Boolean(announcement)), [announcement])

    const handleDismiss = async () => {
        if (!announcement || !user) return
        setIsVisible(false)
        await updateSettings({ dismissed_announcements: [...dismissed, announcement.id] })
    }

    const label = language === 'tr' ? 'Yönetim duyurusu' : language === 'ru' ? 'Объявление руководства' : 'Management announcement'
    const understood = language === 'tr' ? 'Okudum, kapat' : language === 'ru' ? 'Прочитано, закрыть' : 'I have read this'

    return (
        <Dialog open={isVisible && Boolean(announcement)} onOpenChange={open => { if (!open) void handleDismiss() }}>
            {announcement && <DialogContent className="grid h-[min(90dvh,52rem)] w-[min(94vw,72rem)] max-w-none grid-rows-[auto_1fr_auto] overflow-hidden p-0">
                <DialogHeader className="border-b border-border px-7 py-6 pr-16">
                    <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Megaphone className="h-6 w-6" /></div>
                        <div className="min-w-0"><DialogDescription className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Bell className="h-3.5 w-3.5" />{label}</DialogDescription><DialogTitle className="text-2xl sm:text-3xl">{announcement.title}</DialogTitle></div>
                    </div>
                </DialogHeader>
                <div className="min-h-0 overflow-y-auto px-7 py-8 sm:px-10"><p className="mx-auto max-w-4xl whitespace-pre-wrap text-base leading-8 text-foreground sm:text-lg">{announcement.content}</p></div>
                <DialogFooter className="border-t border-border bg-muted/20 px-7 py-4"><Button className="min-w-44" onClick={handleDismiss}>{understood}</Button></DialogFooter>
            </DialogContent>}
        </Dialog>
    )
}
