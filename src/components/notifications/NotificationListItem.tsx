import { X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

import { cn, getDateLocale } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import type { Notification } from '@/types'

import { notificationColors, notificationIcons } from './notificationAppearance'

interface NotificationListItemProps {
    notification: Notification
    /**
     * Makes the row itself clickable. Left off by the dropdown, where the surrounding menu item is
     * already the control: a button inside a menu item would nest two interactive elements and
     * leave keyboard users with a focus stop that does nothing.
     */
    onOpen?: (notification: Notification) => void
    onDismiss?: (notification: Notification) => void
    /**
     * The badge is a fixed width, so a full timestamp would either reflow as the relative text
     * changes width or sit at an unpredictable distance from the title. The page has room for it
     * and its rows are wider than the dropdown's, so it opts in.
     */
    showExactTime?: boolean
}

/**
 * One notification, as the badge dropdown and the full page both render it.
 *
 * Presentational apart from the two optional actions. Both screens need the same icon, title,
 * content, unread dot and relative time, and those had been written out twice.
 */
export function NotificationListItem({
    notification,
    onOpen,
    onDismiss,
    showExactTime = false,
}: NotificationListItemProps) {
    const { t } = useLanguageStore()
    const Icon = notificationIcons[notification.type]

    const body = (
        <>
            {!notification.is_read && (
                <div
                    className="absolute left-1 top-3 w-1 h-1 rounded-full bg-primary"
                    aria-hidden="true"
                />
            )}
            <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', notificationColors[notification.type])}>
                <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-baseline justify-between gap-2">
                    <p className={cn(
                        'text-xs font-semibold truncate pr-5',
                        notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                        {notification.title}
                    </p>
                    <time
                        dateTime={notification.timestamp.toISOString()}
                        className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0"
                    >
                        {showExactTime
                            ? format(notification.timestamp, 'dd MMM yyyy, HH:mm', { locale: getDateLocale() })
                            : formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: getDateLocale() })}
                    </time>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.content}
                </p>
            </div>
        </>
    )

    return (
        <div className="group relative flex gap-2.5 p-3 transition-colors">
            {onOpen ? (
                <button
                    type="button"
                    onClick={() => onOpen(notification)}
                    className={cn(
                        'flex gap-2.5 flex-1 min-w-0 text-left outline-none rounded-md',
                        notification.is_read
                            ? 'hover:bg-muted/50 focus-visible:bg-muted/50'
                            : 'bg-primary/5 hover:bg-primary/10 focus-visible:bg-primary/10'
                    )}
                >
                    {body}
                </button>
            ) : (
                <div className="flex gap-2.5 flex-1 min-w-0">
                    {body}
                </div>
            )}

            {onDismiss && (
                <button
                    type="button"
                    onClick={(event) => {
                        // Kept from reaching the row, so dismissing does not also open the thing the
                        // notification was pointing at.
                        event.stopPropagation()
                        onDismiss(notification)
                    }}
                    className="absolute top-2.5 right-2.5 p-1 text-muted-foreground hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    title={t('common.dismiss') as string}
                    aria-label={t('common.dismiss') as string}
                >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            )}
        </div>
    )
}
