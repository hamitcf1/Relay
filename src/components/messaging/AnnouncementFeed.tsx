import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, EyeOff, Megaphone, Undo2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useAnnouncementFeed } from '@/hooks/useAnnouncementFeed'
import { isAddressedTo } from '@/lib/announcements'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { AnnouncementManager } from '@/components/announcements/AnnouncementManager'
import { TextFormatter } from '@/components/ui/TextFormatter'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatDisplayDate } from '@/lib/utils'

/**
 * The "Genel Duyurular" conversation. It reads from the announcement store rather than from
 * messages, because a withdrawn announcement must disappear from history too, not just from
 * the banner, and because read state now lives on a per-person receipt.
 */
export function AnnouncementFeed() {
    useAnnouncementFeed()
    const { t, language } = useLanguageStore()
    const user = useAuthStore((state) => state.user)
    const hotelId = useHotelStore((state) => state.hotel?.id)
    const { announcements, receipts, markDismissed, recallAnnouncement } = useAnnouncementStore()
    const confirm = useConfirm()
    const [managerOpen, setManagerOpen] = useState(false)

    const visible = useMemo(() => {
        const viewer = { uid: user?.uid, role: user?.role }
        return announcements
            // The author always sees what they published, even when it was aimed at a named subset.
            .filter((item) => isAddressedTo(item, viewer) || item.createdBy === user?.uid)
            // A withdrawn announcement stays in history only for whoever pulled it back.
            .filter((item) => !item.recalledAt || item.createdBy === user?.uid || user?.role === 'gm')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }, [announcements, user?.uid, user?.role])

    const groups = useMemo(() => {
        const result: { date: Date; items: typeof visible }[] = []
        for (const item of visible) {
            const last = result[result.length - 1]
            if (last && isSameDay(last.date, item.createdAt)) last.items.push(item)
            else result.push({ date: item.createdAt, items: [item] })
        }
        return result
    }, [visible])

    const withdraw = async (id: string) => {
        if (!hotelId) return
        const ok = await confirm({
            title: t('announcement.withdraw'),
            description: t('announcement.withdrawConfirm'),
            confirmLabel: t('announcement.withdraw'),
        })
        if (ok) await recallAnnouncement(hotelId, id, user!.name)
    }

    if (visible.length === 0) {
        return <EmptyState icon={Megaphone} title={t('messaging.noMessages')} />
    }

    return (
        <div data-testid="announcement-feed">
            {groups.map((group, index) => (
                <div key={index} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border" />
                        <span className="rounded-full border border-border bg-muted/50 px-2 text-[10px] font-bold uppercase text-muted-foreground">
                            {formatDisplayDate(group.date)}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                    {group.items.map((item) => {
                        const receipt = receipts[item.id]
                        const isAuthor = item.createdBy === user?.uid
                        return (
                            <motion.article
                                key={item.id}
                                data-testid="announcement-feed-row"
                                data-recalled={item.recalledAt ? 'true' : 'false'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'rounded-2xl border p-4',
                                    item.recalledAt ? 'border-dashed border-border bg-muted/30' : 'border-border bg-card',
                                )}
                            >
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    {item.title && <strong className="text-sm">{item.title}</strong>}
                                    <span className={cn(
                                        'rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                                        item.audience === 'all'
                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                            : 'border-border bg-muted/60 text-muted-foreground',
                                    )}>
                                        {item.audience === 'all'
                                            ? t('announcement.everyone')
                                            : language === 'tr'
                                                ? `${item.recipientIds?.length || 0} kişi`
                                                : language === 'ru'
                                                    ? `${item.recipientIds?.length || 0} чел.`
                                                    : `${item.recipientIds?.length || 0} ${(item.recipientIds?.length || 0) === 1 ? 'person' : 'people'}`}
                                    </span>
                                    {item.recalledAt && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            {t('announcement.withdrawn')}
                                        </span>
                                    )}
                                </div>
                                <p className={cn('text-sm leading-relaxed', item.recalledAt && 'text-muted-foreground line-through decoration-muted-foreground/40')}>
                                    <TextFormatter text={item.content} />
                                </p>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-[10px] text-muted-foreground">
                                        {item.createdByName} · {format(item.createdAt, 'HH:mm')}
                                        {item.recalledAt && item.recalledByName
                                            ? ` · ${t('announcement.withdrawnBy', { name: item.recalledByName })}`
                                            : ''}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {user?.role === 'gm' && (
                                            <button
                                                type="button"
                                                aria-label={t('announcement.insights')}
                                                onClick={() => setManagerOpen(true)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                                <BarChart3 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {user?.role === 'gm' && !item.recalledAt && (
                                            <button
                                                type="button"
                                                aria-label={t('announcement.withdraw')}
                                                onClick={() => void withdraw(item.id)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-600"
                                            >
                                                <Undo2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {!isAuthor && receipt?.state !== 'dismissed' && !item.recalledAt && hotelId && (
                                            <button
                                                type="button"
                                                aria-label={t('common.close')}
                                                onClick={() => void markDismissed(hotelId, item.id, user!.uid)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                                <EyeOff className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        )
                    })}
                </div>
            ))}
            <AnnouncementManager open={managerOpen} onOpenChange={setManagerOpen} />
        </div>
    )
}
