import { useEffect, useRef } from 'react'

import { showDesktopNotification } from '@/lib/desktopNotifications'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification } from '@/types'

/**
 * Raises a desktop notification for anything that arrives while the app is open.
 *
 * ## Why the first batch is never shown
 *
 * The notification list arrives from a subscription, so the first render after mounting already
 * holds everything that has accumulated since the last visit. Announcing all of it would fire a
 * burst of toasts at someone who had simply opened the app, which is the fastest way to make them
 * switch this off. So the first batch is the baseline: it is recorded and nothing is raised. Only
 * notifications that show up afterwards are announced, which is the case worth a toast.
 *
 * The same reasoning is why this is a hook on the dashboard rather than something inside
 * `addNotification`. Most notifications are not written by the browser tab that receives them: they
 * are written by whoever sent the message, which is another account, another device. The local
 * store is the only place that sees the whole set.
 *
 * ## What it does not do
 *
 * Nothing arrives when the tab is closed. That needs a push service, a server and VAPID keys, and
 * is a different piece of work rather than a bigger version of this one.
 */
export function useDesktopNotifications() {
    const notifications = useNotificationStore((state) => state.notifications)
    // Not `!loading`: a store that has not been subscribed to yet is also not loading, and
    // `NotificationDropdown` is rendered inside the dashboard's own tree, so its subscription is
    // set up after this hook runs. Priming on an empty list that has not been delivered yet would
    // make every existing notification look new, and opening the app would fire a burst of toasts.
    const loaded = useNotificationStore((state) => state.loaded)
    const enabled = useAuthStore((state) => state.user?.settings?.desktop_notifications === true)

    // Ids already accounted for. Kept out of the dependency list on purpose: this is a running
    // tally, not a value anything renders from, and re-running the effect on it would reset the
    // baseline and announce the whole list again.
    const seen = useRef<Set<string> | null>(null)

    useEffect(() => {
        // Nothing has been delivered yet, so there is no baseline to take.
        if (!loaded) return

        // Priming. Whatever is here now arrived before this visit, and is the same on every visit,
        // so announcing it would be announcing history.
        if (seen.current === null) {
            seen.current = new Set(notifications.map((n) => n.id))
            return
        }

        const arrived = notifications.filter((n) => !seen.current!.has(n.id))
        for (const notification of arrived) seen.current!.add(notification.id)

        if (!enabled || arrived.length === 0) return

        for (const notification of arrived) {
            if (notification.is_read) continue
            announce(notification)
        }
    }, [notifications, loaded, enabled])
}

/**
 * Money owed stays on screen until it is dealt with. Everything else is a glance.
 *
 * Keyed by notification id so the same debt cannot stack up toasts: the platform collapses a
 * repeated tag, and the tag changes when the outstanding amount does, so a partial payment still
 * produces a fresh one.
 */
function announce(notification: Notification) {
    showDesktopNotification({
        title: notification.title,
        body: notification.content,
        tag: notification.id,
        requireInteraction: notification.type === 'payment',
    })
}
