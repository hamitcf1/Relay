import {
    AlertCircle,
    Bell,
    CreditCard,
    Info,
    MessageCircle,
    UserCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/types'

/**
 * How each kind of notification looks.
 *
 * Shared rather than declared per screen because the badge and the full page have to agree, and
 * they had already drifted once: adding the `payment` type meant editing two separate maps, and
 * nothing would have said if only one of them had been updated.
 *
 * A new NotificationType has to be added here too. The maps are typed as complete records, so
 * TypeScript fails to compile on a type that has no entry, which is the point of the annotation.
 */
export const notificationIcons: Record<NotificationType, LucideIcon> = {
    compliance: AlertCircle,
    message: MessageCircle,
    announcement: Info,
    off_day: UserCheck,
    // Money owed is the one category a manager acts on from another screen, so it gets its own
    // mark rather than borrowing the compliance alert's.
    payment: CreditCard,
    system: Bell,
}

export const notificationColors: Record<NotificationType, string> = {
    compliance: 'text-rose-500 bg-rose-500/10 dark:text-rose-400',
    message: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400',
    announcement: 'text-amber-500 bg-amber-500/10 dark:text-amber-400',
    off_day: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400',
    payment: 'text-amber-600 bg-amber-500/15 dark:text-amber-300 dark:bg-amber-500/20',
    system: 'text-muted-foreground bg-muted',
}
