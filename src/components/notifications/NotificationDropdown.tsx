import { useEffect } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
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
import { NotificationListItem } from './NotificationListItem'
import { useNotificationStore } from '@/stores/notificationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

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
            confirmLabel: t('notifications.clearAll') as string || 'Clear All'
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
                    aria-label={unreadCount > 0
                        ? `${t('notifications.title')} (${t('notifications.unreadBadge', { count: String(unreadCount) })})`
                        : t('notifications.title')}
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
                            {notifications.map((n) => (
                                <DropdownMenuItem
                                    key={n.id}
                                    onSelect={(e) => {
                                        // Keeps the menu open so the click reads as "go there" rather
                                        // than "dismiss and stay", and the destination is a full
                                        // screen anyway.
                                        e.preventDefault()
                                        handleNotificationClick(n)
                                    }}
                                    className="cursor-pointer outline-none"
                                >
                                    <NotificationListItem
                                        notification={n}
                                        onDismiss={(item) => hotel?.id && removeNotification(hotel.id, item.id)}
                                    />
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </div>

                <DropdownMenuSeparator className="bg-border m-0" />
                <DropdownMenuItem
                    onSelect={() => navigate('/notifications')}
                    className="w-full rounded-none h-9 text-xs text-muted-foreground hover:text-foreground focus:text-foreground flex items-center justify-center cursor-pointer focus:bg-muted"
                >
                    {t('notifications.viewAll')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu >
    )
}

