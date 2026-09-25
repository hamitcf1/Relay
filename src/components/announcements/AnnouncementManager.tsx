import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Eye, EyeOff, Megaphone, RotateCcw, Trash2, Undo2, Users } from 'lucide-react'
import { format } from 'date-fns'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getAudienceSummary, isAnnouncementVisibleTo, type AudienceEntry } from '@/lib/announcements'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/types'

const stamp = (at?: Date) => (at ? format(at, 'd MMM HH:mm') : '')

/**
 * The management view of announcements: who has not opened one, who has, and who closed it,
 * plus the controls to withdraw, restore or purge what was published.
 */
export function AnnouncementManager({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { t } = useLanguageStore()
    const user = useAuthStore((state) => state.user)
    const hotelId = useHotelStore((state) => state.hotel?.id)
    const staff = useRosterStore((state) => state.staff)
    const { announcements, audience, subscribeToAudience, recallAnnouncement, restoreAnnouncement, purgeAnnouncement } = useAnnouncementStore()
    const confirm = useConfirm()
    const [expanded, setExpanded] = useState<string | null>(null)

    const viewer = useMemo(() => ({ uid: user?.uid, role: user?.role }), [user?.uid, user?.role])
    const visible = useMemo(
        () => announcements.filter((item) => isAnnouncementVisibleTo(item, viewer)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        [announcements, viewer],
    )

    // Receipts are only fetched for the announcement being opened, so a long history stays cheap.
    // The role check lives here too, not just in the render, so no listener is ever attached.
    useEffect(() => {
        if (!open || !hotelId || !expanded || user?.role !== 'gm') return
        return subscribeToAudience(hotelId, expanded)
    }, [open, hotelId, expanded, user?.role, subscribeToAudience])

    if (user?.role !== 'gm') return null

    const receiptsFor = (announcement: Announcement) => audience[announcement.id] || {}
    const withdraw = async (announcement: Announcement) => {
        if (!hotelId) return
        const ok = await confirm({ title: t('announcement.withdraw'), description: t('announcement.withdrawConfirm'), confirmLabel: t('announcement.withdraw') })
        if (ok) await recallAnnouncement(hotelId, announcement.id, user!.name)
    }
    const purge = async (announcement: Announcement) => {
        if (!hotelId) return
        const ok = await confirm({ title: t('announcement.purge'), description: t('announcement.purgeConfirm'), variant: 'destructive', confirmLabel: t('announcement.purge') })
        if (ok) {
            await purgeAnnouncement(hotelId, announcement.id)
            setExpanded((current) => (current === announcement.id ? null : current))
        }
    }
    const group = (
        label: string,
        Icon: typeof Users,
        entries: AudienceEntry[],
        tone: string,
    ) => (
        <div className="rounded-lg border border-border/70 p-2">
            <p className={cn('mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider', tone)}>
                <Icon className="h-3.5 w-3.5" />{label}
                <span className="font-normal opacity-70">({entries.length})</span>
            </p>
            {entries.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
            ) : (
                <ul className="space-y-0.5">
                    {entries.map((entry) => (
                        <li key={entry.uid} className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="truncate">{entry.name}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{entry.at ? stamp(entry.at) : ''}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )

    const renderRow = (announcement: Announcement) => {
        const summary = getAudienceSummary(announcement, receiptsFor(announcement), staff)
        const open = expanded === announcement.id
        return (
            <li
                key={announcement.id}
                data-testid="announcement-manager-row"
                data-recalled={announcement.recalledAt ? 'true' : 'false'}
                className={cn('rounded-lg border', announcement.recalledAt ? 'border-border bg-muted/40' : 'border-border bg-background')}
            >
                <div className="flex flex-wrap items-center gap-2 p-3">
                    <button
                        type="button"
                        onClick={() => setExpanded(open ? null : announcement.id)}
                        aria-expanded={open}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                        <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{announcement.title || announcement.content}</span>
                            <span className="block text-[10px] text-muted-foreground">
                                {format(announcement.createdAt, 'd MMM HH:mm')} · {t('announcement.sentBy')} {announcement.createdByName} ·{' '}
                                {announcement.audience === 'all'
                                    ? t('announcement.everyone')
                                    : t('announcement.selectedCount', { count: String((announcement.recipientIds || []).length) })}
                            </span>
                        </span>
                    </button>
                    {announcement.recalledAt
                        ? <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{t('announcement.withdrawn')}</span>
                        : (
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                <Eye className="h-3 w-3" />{summary.seen.length + summary.dismissed.length}/{summary.total}
                            </span>
                        )}
                </div>
                {open && (
                    <div className="space-y-2 border-t border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">{t('announcement.readReceipts')}</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {group(t('announcement.notSeenYet'), Users, summary.pending, 'text-muted-foreground')}
                            {group(t('announcement.seen'), Eye, summary.seen, 'text-sky-600 dark:text-sky-400')}
                            {group(t('announcement.dismissed'), EyeOff, summary.dismissed, 'text-emerald-600 dark:text-emerald-400')}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                            {announcement.recalledAt ? (
                                <>
                                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => hotelId && void restoreAnnouncement(hotelId, announcement.id)}>
                                        <RotateCcw className="h-3.5 w-3.5" />{t('announcement.restore')}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="gap-1.5 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => void purge(announcement)}>
                                        <Trash2 className="h-3.5 w-3.5" />{t('announcement.purge')}
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void withdraw(announcement)}>
                                    <Undo2 className="h-3.5 w-3.5" />{t('announcement.withdraw')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </li>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden" data-testid="announcement-manager">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('announcement.insights')}</DialogTitle>
                    <DialogDescription>{t('announcement.readReceipts')}</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {visible.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">—</p>
                    ) : (
                        <ul className="space-y-2">{visible.map(renderRow)}</ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
