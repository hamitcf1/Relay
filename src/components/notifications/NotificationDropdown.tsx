import { useEffect } from 'react'
import { Bell, CheckCheck, MessageCircle, AlertCircle, Info, UserCheck, X } from 'lucide-react'
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
import { getDateLocale } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/types'

const notificationIcons: Record<NotificationType, any> = {
    compliance: AlertCircle,
    message: MessageCircle,
    announcement: Info,
    off_day: UserCheck,
    system: Bell
}

const notificationColors: Record<NotificationType, string> = {
    compliance: 'text-rose-400 bg-rose-500/10',
    message: 'text-indigo-400 bg-indigo-500/10',
    announcement: 'text-amber-400 bg-amber-500/10',
    off_day: 'text-emerald-400 bg-emerald-500/10',
    system: 'text-zinc-400 bg-zinc-500/10'
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
        markAllAsRead
    } = useNotificationStore()
    const { t } = useLanguageStore()

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-zinc-800 transition-all active:scale-95">
                    <Bell className={cn("w-5 h-5 transition-colors", unreadCount > 0 ? "text-indigo-400" : "text-zinc-400")} />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-zinc-950"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-zinc-900/95 backdrop-blur-md border-zinc-800 p-0 shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                    <DropdownMenuLabel className="p-0 font-bold text-base text-white font-sans">{t('notifications.title')}</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-8 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            {t('notifications.markAllRead')}
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-zinc-500 font-medium">{t('notifications.noNotifications')}</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {notifications.map((n) => {
                                const Icon = notificationIcons[n.type]
                                return (
                                    <DropdownMenuItem
                                        key={n.id}
                                        onSelect={() => handleNotificationClick(n)}
                                        className={cn(
                                            "flex gap-3 p-4 transition-all cursor-pointer focus:bg-zinc-800/50 relative group outline-none",
                                            !n.is_read && "bg-indigo-500/[0.03]"
                                        )}
                                    >
                                        {!n.is_read && (
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                                        )}
                                        <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", notificationColors[n.type])}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={cn("text-xs font-bold truncate pr-6", n.is_read ? "text-zinc-400" : "text-white")}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                                                    {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: getDateLocale() })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                                                {n.content}
                                            </p>
                                        </div>

                                        {/* Dismiss Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (hotel?.id) {
                                                    removeNotification(hotel.id, n.id)
                                                }
                                            }}
                                            className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-white hover:bg-zinc-700/50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            title={t('common.dismiss') as string}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </DropdownMenuItem>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DropdownMenuSeparator className="bg-zinc-800 m-0" />
                <DropdownMenuItem
                    onSelect={() => navigate('/operations')}
                    className="w-full rounded-none h-11 text-xs text-zinc-500 hover:text-white focus:text-white transition-colors flex items-center justify-center cursor-pointer focus:bg-zinc-800"
                >
                    {t('notifications.viewAll')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

