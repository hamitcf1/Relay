import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAnnouncementStore } from '@/stores/announcementStore'

/**
 * Announcements are read by both the dashboard banner and the full screen modal, so the
 * subscription is shared: the first caller starts it, later callers reuse the same listeners.
 */
let active: { key: string; stops: Array<() => void>; users: number } | null = null

/**
 * Keeps one shared subscription alive for as long as any screen needs it.
 *
 * The count matters because these consumers do not mount and unmount together. The dashboard
 * renders the banner, and the modal is also mounted there, so both are live at once; the messaging
 * panel mounts a third consumer on a different screen. Without counting, whichever consumer mounted
 * first owned the subscription and the first one to unmount tore the listeners down for the others
 * still on screen. A later mount would have started fresh listeners, but a consumer that mounted
 * while the count was stale kept an empty store with no subscription of its own, so read receipts
 * silently stopped arriving and every announcement looked unread again.
 */
export function useAnnouncementFeed() {
    const hotelId = useHotelStore((state) => state.hotel?.id)
    const uid = useAuthStore((state) => state.user?.uid)

    useEffect(() => {
        if (!hotelId || !uid) return
        const key = `${hotelId}:${uid}`

        // Already live for this hotel and person: join the existing subscription.
        if (active?.key === key) {
            active.users += 1
            return () => { release(key) }
        }

        // Either no subscription, or one for a different hotel or person. Stop it and start over.
        active?.stops.forEach((stop) => stop())
        const { subscribeToAnnouncements, subscribeToMyReceipts } = useAnnouncementStore.getState()
        const stops = [subscribeToAnnouncements(hotelId), subscribeToMyReceipts(hotelId, uid)]
        active = { key, stops, users: 1 }
        return () => { release(key) }
    }, [hotelId, uid])
}

/** Drops one consumer, and only tears the listeners down when the last one has gone. */
function release(key: string) {
    if (active?.key !== key) return
    active.users -= 1
    if (active.users > 0) return
    active.stops.forEach((stop) => stop())
    active = null
}
