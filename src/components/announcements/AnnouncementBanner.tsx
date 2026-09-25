import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, BarChart3, Eye, Info, Undo2, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useAnnouncementFeed } from '@/hooks/useAnnouncementFeed'
import { bannerAnnouncements, pendingRetractions } from '@/lib/announcements'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { AnnouncementManager } from './AnnouncementManager'
import { cn } from '@/lib/utils'

const RECENCY_MS = 1000 * 60 * 60 * 24

/**
 * Surfaces management announcements at the top of the dashboard, and tells a reader when one
 * they had already seen has been withdrawn, so a retraction is never silent.
 */
export function AnnouncementBanner() {
    useAnnouncementFeed()
    const { t } = useLanguageStore()
    const user = useAuthStore((state) => state.user)
    const hotelId = useHotelStore((state) => state.hotel?.id)
    const { announcements, receipts, markDismissed, recallAnnouncement, acknowledgeRecall } = useAnnouncementStore()
    const confirm = useConfirm()
    const [managerOpen, setManagerOpen] = useState(false)

    const viewer = useMemo(() => ({ uid: user?.uid, role: user?.role }), [user?.uid, user?.role])
    const active = useMemo(
        () => bannerAnnouncements(announcements, receipts, viewer, RECENCY_MS),
        [announcements, receipts, viewer],
    )
    // Withdrawals this reader has not acknowledged yet. Unlike a fresh announcement these carry no
    // expiry: the point of a retraction is to stop someone acting on stale information, and a
    // notice that quietly disappears after a day lets exactly that happen unnoticed.
    const retracted = useMemo(
        () => pendingRetractions(announcements, receipts, viewer),
        [announcements, receipts, viewer],
    )

    const withdraw = async (id: string) => {
        if (!hotelId) return
        const ok = await confirm({ title: t('announcement.withdraw'), description: t('announcement.withdrawConfirm'), confirmLabel: t('announcement.withdraw') })
        if (ok) await recallAnnouncement(hotelId, id, user!.name)
    }

    if (active.length === 0 && retracted.length === 0) return null

    return (
        <div className="mb-4 space-y-2" data-testid="announcement-banner">
            <AnimatePresence>
                {retracted.map((item) => (
                    <motion.div
                        key={`retracted-${item.id}`}
                        initial={{ opacity: 0, y: -12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -12, height: 0 }}
                        data-testid="announcement-retracted"
                        className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4"
                    >
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('announcement.withdrawn')}
                            </p>
                            {item.title && <p className="mt-0.5 text-sm font-semibold text-foreground">{item.title}</p>}
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {item.recalledByName
                                    ? t('announcement.recallNoticeBy', { name: item.recalledByName })
                                    : t('announcement.recallNotice')}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => void acknowledgeRecall(hotelId!, item.id, user!.uid)}
                        >
                            {t('announcement.recallAck')}
                        </Button>
                    </motion.div>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {active.map((item) => {
                    const receipt = receipts[item.id]
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            data-testid="announcement-row"
                            className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-4"
                        >
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-300" />
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300">{t('announcement.title')}</span>
                                    <span className="text-[10px] text-amber-600/60 dark:text-amber-400/80">
                                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                    </span>
                                    {receipt && (
                                        <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                            <Eye className="h-3 w-3" />{t('announcement.seen')}
                                        </span>
                                    )}
                                </div>
                                {item.title && <p className="text-sm font-semibold text-amber-900 dark:text-white">{item.title}</p>}
                                <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-white/90">{item.content}</p>
                                <p className="mt-1 text-[10px] font-bold text-amber-900 dark:text-white">— {item.createdByName}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                {user?.role === 'gm' && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label={t('announcement.insights')}
                                            onClick={() => setManagerOpen(true)}
                                            className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label={t('announcement.withdraw')}
                                            onClick={() => void withdraw(item.id)}
                                            className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                                        >
                                            <Undo2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={t('common.close')}
                                    disabled={receipt?.state === 'dismissed'}
                                    onClick={() => void markDismissed(hotelId!, item.id, user!.uid)}
                                    className={cn('h-6 w-6 p-0 text-amber-500 hover:bg-amber-500/10 hover:text-amber-300', receipt?.state === 'dismissed' && 'opacity-30')}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>

            <AnnouncementManager open={managerOpen} onOpenChange={setManagerOpen} />
        </div>
    )
}
