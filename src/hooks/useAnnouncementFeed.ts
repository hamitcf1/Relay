import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAnnouncementStore } from '@/stores/announcementStore'

/**
 * Announcements are read by both the dashboard banner and the full screen modal, so the
 * subscription is shared: the first caller starts it, later callers reuse the same listeners.
 */
let active: { key: string; stops: Array<() => void> } | null = null

export function useAnnouncementFeed() {
    const hotelId = useHotelStore((state) => state.hotel?.id)
    const uid = useAuthStore((state) => state.user?.uid)

    useEffect(() => {
        if (!hotelId || !uid) return
        const key = `${hotelId}:${uid}`
        if (active?.key === key) return () => { }

        active?.stops.forEach((stop) => stop())
        const { subscribeToAnnouncements, subscribeToMyReceipts } = useAnnouncementStore.getState()
        const stops = [subscribeToAnnouncements(hotelId), subscribeToMyReceipts(hotelId, uid)]
        active = { key, stops }
        return () => {
            stops.forEach((stop) => stop())
            if (active?.key === key) active = null
        }
    }, [hotelId, uid])
}
