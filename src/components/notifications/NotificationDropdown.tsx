import { useEffect } from 'react'
import { Bell, CheckCheck, MessageCircle, AlertCircle, Info, UserCheck, X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/stores/notificationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { formatDistanceToNow } from 'date-fns'
import { cn, getDateLocale } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { NotificationType } from '@/types'

const notificationIcons: Record<NotificationType, any> = {
    compliance: AlertCircle,
    message: MessageCircle,
    announcement: Info,
    off_day: UserCheck,
    system: Bell
}

const notificationColors: Record<NotificationType, string> = {
    compliance: 'text-rose-500 bg-rose-500/10 dark:text-rose-400',
    message: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400',
    announcement: 'text-amber-500 bg-amber-500/10 dark:text-amber-400',
    off_day: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400',
    system: 'text-muted-foreground bg-muted'
}

export function NotificationDropdown() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const navigate = useNavigate()
    const {
        notifications,
        unreadCount,
        subscribeToNotifications,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        removeNotification
    } = useNotificationStore()
    const { t } = useLanguageStore()
    const confirm = useConfirm()

    useEffect(() => {
        if (user && hotel?.id) {
            const unsub = subscribeToNotifications(hotel.id, user.uid, user.role)
            return () => unsub()
        }
    }, [user, hotel?.id])

    const handleMarkAllRead = () => {
        if (hotel?.id) markAllAsRead(hotel.id)
    }

    const handleNotificationClick = (n: any) => {
        if (!hotel?.id) return
        markAsRead(hotel.id, n.id)
        if (n.link) {
            navigate(n.link)
        }
    }

    const handleClearAll = async () => {
        if (!hotel?.id) return
        const confirmed = await confirm({
            title: t('notifications.clearAllConfirm') as string || 'Clear all notifications?',
            description: t('notifications.clearAllDescription') as string || 'This action cannot be undone.',
            variant: 'destructive',
            confirmLabel: t('common.clear') as string || 'Clear All'
        })
        if (confirmed) {
            await clearAllNotifications(hotel.id)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="relative p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
                    aria-label={unreadCount > 0 ? `${t('notifications.title')} (${unreadCount} unread)` : t('notifications.title')}
                >
                    <Bell aria-hidden="true" className={cn("w-5 h-5 transition-colors", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-background"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover border-border p-0 shadow-md">
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-border">
                    <DropdownMenuLabel className="p-0 font-semibold text-sm text-foreground">{t('notifications.title')}</DropdownMenuLabel>
                    <div className="flex items-center gap-0.5">
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClearAll}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                title={t('notifications.clearAll') as string || 'Clear All'}
                                aria-label={t('notifications.clearAll') as string}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllRead}
                                className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                            >
                                <CheckCheck className="w-3 h-3" aria-hidden="true" />
                                {t('notifications.markAllRead')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                            <Bell className="w-7 h-7 text-muted-foreground mx-auto mb-2 opacity-30" aria-hidden="true" />
                            <p className="text-sm text-muted-foreground">{t('notifications.noNotifications')}</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {notifications.map((n) => {
                                const Icon = notificationIcons[n.type]
                                return (
                                    <DropdownMenuItem
                                        key={n.id}
                                        onSelect={(e) => {
                                            e.preventDefault()
                                            handleNotificationClick(n)
                                        }}
                                        className={cn(
                                            "flex gap-2.5 p-3 cursor-pointer relative group outline-none transition-colors",
                                            !n.is_read ? "bg-primary/5 hover:bg-primary/10 focus:bg-primary/10" : "hover:bg-muted/50 focus:bg-muted/50"
                                        )}
                                    >
                                        {!n.is_read && (
                                            <div className="absolute left-1 top-3 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
                                        )}
                                        <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", notificationColors[n.type])}>
                                            <Icon className="w-4 h-4" aria-hidden="true" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <p className={cn("text-xs font-semibold truncate pr-5", n.is_read ? "text-muted-foreground" : "text-foreground")}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                    {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: getDateLocale() })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {n.content}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (hotel?.id) {
                                                    removeNotification(hotel.id, n.id)
                                                }
                                            }}
                                            className="absolute top-1.5 right-1.5 p-1 text-muted-foreground hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={t('common.dismiss') as string}
                                            aria-label={t('common.dismiss') as string}
                                        >
                                            <X className="w-3 h-3" aria-hidden="true" />
                                        </button>
                                    </DropdownMenuItem>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DropdownMenuSeparator className="bg-border m-0" />
                <DropdownMenuItem
                    onSelect={() => navigate('/operations?tab=activity')}
                    className="w-full rounded-none h-9 text-xs text-muted-foreground hover:text-foreground focus:text-foreground flex items-center justify-center cursor-pointer focus:bg-muted"
                >
                    {t('notifications.viewAll')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu >
    )
}

