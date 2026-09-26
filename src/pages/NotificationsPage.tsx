import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'

import { Button } from '@/components/ui/button'
import { NotificationListItem } from '@/components/notifications/NotificationListItem'
import { useAuthStore } from '@/stores/authStore'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguageStore } from '@/stores/languageStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn, getDateLocale } from '@/lib/utils'
import type { Notification } from '@/types'

/** The translate function the language store exposes, taken from it so the two cannot drift. */
type TFn = ReturnType<typeof useLanguageStore.getState>['t']

/**
 * The full notification list, at its own route.
 *
 * The badge dropdown is a summary: it caps its scroll at 400px and shows everything as one flat
 * run, so a manager who has been working a shift for a few hours cannot tell a payment reminder
 * from a message without scrolling through the noise. This page exists for the "what is waiting
 * for me" question, and groups by day so recency is legible without reading the timestamps.
 *
 * It is a route rather than a workspace module on purpose. A module takes a slot in the sidebar and
 * a position in the navigation config, and this is a destination you arrive at from a reminder
 * rather than a place you browse to, so spending one of those on it would be a poor trade.
 *
 * The subscription is set up here rather than inherited from the dashboard, because arriving directly
 * at this URL never mounts DashboardPage and nothing would otherwise be listening.
 */
export function NotificationsPage() {
    const { t } = useLanguageStore()
    const { user } = useAuthStore()
    const { notifications, unreadCount, subscribeToNotifications, markAsRead, markAllAsRead, clearAllNotifications, removeNotification } = useNotificationStore()
    const confirm = useConfirm()
    const navigate = useNavigate()

    // Taken from the account rather than the hotel store. The page never renders anything about
    // the hotel, and reading the hotel document on every visit would be a round trip bought for
    // nothing.
    const hotelId = user?.hotel_id

    useEffect(() => {
        if (!hotelId || !user) return
        return subscribeToNotifications(hotelId, user.uid, user.role)
    }, [hotelId, user, subscribeToNotifications])

    const groups = useMemo(() => groupByDay(notifications, t), [notifications, t])

    const handleOpen = (notification: Notification) => {
        if (hotelId) markAsRead(hotelId, notification.id)
        if (notification.link) navigate(notification.link)
    }

    const handleClearAll = async () => {
        if (!hotelId) return
        const confirmed = await confirm({
            title: t('notifications.clearAllConfirm') as string,
            description: t('notifications.clearAllDescription') as string,
            variant: 'destructive',
            // Not `common.clear`, which is the chat's "Clear Chat" label and reads as the wrong
            // action entirely in a dialog about notifications.
            confirmLabel: t('notifications.clearAll') as string
        })
        if (confirmed) await clearAllNotifications(hotelId)
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
                <div className="mx-auto w-full max-w-3xl px-4 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        aria-label={t('common.back') as string}
                        title={t('common.back') as string}
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </Button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold truncate">{t('notifications.title')}</h1>
                        <p className="text-[11px] text-muted-foreground">
                            {unreadCount > 0
                                ? t('notifications.unreadCount', { count: String(unreadCount) })
                                : t('notifications.allRead')}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => hotelId && markAllAsRead(hotelId)}
                            className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                            // The label is hidden on narrow screens and the icon is aria-hidden, so
                            // without this the button has no accessible name at all there.
                            aria-label={t('notifications.markAllRead') as string}
                            title={t('notifications.markAllRead') as string}
                        >
                            <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                        </Button>
                    )}

                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearAll}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={t('notifications.clearAll') as string}
                            title={t('notifications.clearAll') as string}
                        >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-3xl px-2 sm:px-4 py-4 pb-16">
                {notifications.length === 0 ? (
                    <div className="py-20 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">{t('notifications.noNotifications')}</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <section key={group.key} className="mb-5">
                            <h2 className="sticky top-[3.25rem] z-[1] bg-background/95 backdrop-blur px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {group.label}
                            </h2>
                            <ul className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/50">
                                {group.items.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={cn(
                                            'relative',
                                            notification.is_read ? '' : 'bg-primary/[0.04]'
                                        )}
                                    >
                                        <NotificationListItem
                                            notification={notification}
                                            onOpen={handleOpen}
                                            onDismiss={(n) => hotelId && removeNotification(hotelId, n.id)}
                                            showExactTime
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                )}
            </main>
        </div>
    )
}

/**
 * Notifications into newest-first day buckets.
 *
 * The buckets are cut on local midnight rather than on "the last 24 hours", so a reminder from
 * yesterday evening stays under yesterday no matter when it is read. Ordering is by the start of
 * the day, which keeps the newest group first without comparing every timestamp.
 */
function groupByDay(notifications: Notification[], t: TFn) {
    const buckets = new Map<number, Notification[]>()

    for (const notification of notifications) {
        const day = startOfDay(notification.timestamp).getTime()
        const existing = buckets.get(day)
        if (existing) existing.push(notification)
        else buckets.set(day, [notification])
    }

    return [...buckets.entries()]
        .sort(([a], [b]) => b - a)
        .map(([day, items]) => ({
            key: String(day),
            label: dayLabel(new Date(day), t),
            items
        }))
}

function dayLabel(day: Date, t: TFn) {
    if (isToday(day)) return t('notifications.day.today')
    if (isYesterday(day)) return t('notifications.day.yesterday')
    return format(day, 'd MMMM yyyy', { locale: getDateLocale() })
}
