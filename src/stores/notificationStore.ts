import { create } from 'zustand'
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
    limit,
    writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Notification, NotificationType, UserRole } from '@/types'

let demoAudience: { uid: string; role: UserRole } | null = null

/** Clears the module scoped demo audience so a signed out account stops being addressed. */
export function clearNotificationDemoAudience() {
    demoAudience = null
}

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    error: string | null
}

interface NotificationActions {
    subscribeToNotifications: (hotelId: string, uid: string, role: UserRole) => () => void
    addNotification: (hotelId: string, notification: Omit<Notification, 'id' | 'timestamp' | 'is_read'>) => Promise<void>
    markAsRead: (hotelId: string, notificationId: string) => Promise<void>
    markAllAsRead: (hotelId: string) => Promise<void>
    clearAllNotifications: (hotelId: string) => Promise<void>
    removeNotification: (hotelId: string, notificationId: string) => Promise<void>
}

type NotificationStore = NotificationState & NotificationActions

const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date()
    if (timestamp instanceof Timestamp) return timestamp.toDate()
    if (timestamp instanceof Date) return timestamp
    return new Date()
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,

    subscribeToNotifications: (hotelId, uid, role) => {
        set({ loading: true, error: null })

        const notificationsRef = collection(db, 'hotels', hotelId, 'notifications')

        // Query notifications for this user (direct or role-based)
        // Note: Firestore doesn't support "OR" easily across different fields without complex composite indexes
        // so we'll subscribe to all for the hotel and filter in memory, or simplify the query.
        // For a hotel's scale, subscribing to all hotel notifications and filtering by target_uid/target_role is feasible.

        const q = query(
            notificationsRef,
            orderBy('timestamp', 'desc'),
            limit(50)
        )

        // Mock Notifications for Live Demo
        if (hotelId === 'demo-hotel-id') {
            demoAudience = { uid, role }
            const mockNotifications: Notification[] = [
                {
                    id: 'demo-fixture-welcome',
                    type: 'system',
                    title: 'Welcome to Relay Demo',
                    content: 'This is a simulated environment. Feel free to explore!',
                    timestamp: new Date(),
                    is_read: false
                },
                {
                    id: 'demo-fixture-housekeeping',
                    type: 'message',
                    title: 'New Message from Housekeeping',
                    content: 'Room 204 is ready for inspection.',
                    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                    is_read: true,
                    target_role: 'receptionist'
                }
            ]

            set((state) => {
                // Merge rather than replace. In production a notification written through
                // addNotification comes back on the next snapshot, so a wholesale set is harmless
                // there. The demo has no server, so a locally added notification only exists in
                // this array, and replacing the array destroyed it.
                //
                // That was not cosmetic. The unpaid-sale reminder writes here on mount, and the
                // notification dropdown subscribes immediately afterwards, so every demo login
                // created the reminder and then threw it away, while the "already reported" record
                // said it had been dealt with and it never came back.
                //
                // Fixture entries are re-applied each time this runs, so a fixture deleted earlier
                // reappears on the next subscribe. That is acceptable for demo content and is the
                // behaviour that was there before.
                const fixtureIds = new Set(mockNotifications.map((n) => n.id))
                const created = state.notifications.filter((n) => !fixtureIds.has(n.id))
                const merged = [...mockNotifications, ...created]
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

                return {
                    notifications: merged,
                    // Counted rather than pinned to 1, so a notification added at runtime is
                    // reflected in the badge instead of being overwritten by the fixture count.
                    unreadCount: merged.filter((n) => !n.is_read).length,
                    loading: false,
                    error: null
                }
            })
            return () => { }
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const allNotifications: Notification[] = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    type: data.type as NotificationType,
                    title: data.title,
                    content: data.content,
                    timestamp: convertTimestamp(data.timestamp),
                    is_read: data.is_read || false,
                    target_role: data.target_role,
                    target_uid: data.target_uid,
                    link: data.link
                }
            })

            // 15-day Auto Cleanup
            const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
            const oldNotifications = allNotifications.filter(n => n.timestamp < fifteenDaysAgo)
            
            if (oldNotifications.length > 0) {
                try {
                    const batch = writeBatch(db)
                    oldNotifications.forEach(n => {
                        const docRef = doc(db, 'hotels', hotelId, 'notifications', n.id)
                        batch.delete(docRef)
                    })
                    await batch.commit()
                } catch (e) {
                    console.error("Auto-cleanup error:", e)
                }
            }

            // Filter for the current user
            const filtered = allNotifications.filter(n => {
                if (n.target_uid === uid) return true
                if (n.target_role === 'all') return true
                if (n.target_role === role) return true
                if (!n.target_uid && !n.target_role) return true // System wide for the hotel
                return false
            })

            const unread = filtered.filter(n => !n.is_read).length

            set({
                notifications: filtered,
                unreadCount: unread,
                loading: false
            })
        }, (err) => {
            console.error("Notification subscription error:", err)
            set({ error: err.message, loading: false })
        })

        return unsubscribe
    },

    addNotification: async (hotelId, notification) => {
        try {
            if (hotelId === 'demo-hotel-id') {
                const appliesToCurrentUser = !notification.target_uid && !notification.target_role
                    || notification.target_uid === demoAudience?.uid
                    || notification.target_role === 'all'
                    || notification.target_role === demoAudience?.role
                if (!appliesToCurrentUser) return
                const next: Notification = { ...notification, id: `demo-notification-${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date(), is_read: false }
                const notifications = [next, ...get().notifications]
                set({ notifications, unreadCount: notifications.filter(item => !item.is_read).length })
                return
            }
            const notificationsRef = collection(db, 'hotels', hotelId, 'notifications')
            await addDoc(notificationsRef, {
                ...notification,
                timestamp: serverTimestamp(),
                is_read: false
            })
        } catch (error: any) {
            console.error("Error adding notification:", error)
            throw error
        }
    },

    markAsRead: async (hotelId, notificationId) => {
        try {
            if (hotelId === 'demo-hotel-id') {
                const notifications = get().notifications.map(item => item.id === notificationId ? { ...item, is_read: true } : item)
                set({ notifications, unreadCount: notifications.filter(item => !item.is_read).length })
                return
            }
            const docRef = doc(db, 'hotels', hotelId, 'notifications', notificationId)
            await updateDoc(docRef, { is_read: true })
        } catch (error: any) {
            console.error("Error marking notification as read:", error)
        }
    },

    markAllAsRead: async (hotelId) => {
        const { notifications } = get()
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)

        if (unreadIds.length === 0) return

        if (hotelId === 'demo-hotel-id') {
            set({
                notifications: notifications.map(n => (n.is_read ? n : { ...n, is_read: true })),
                unreadCount: 0,
            })
            return
        }

        try {
            const batch = writeBatch(db)
            unreadIds.forEach(id => {
                const docRef = doc(db, 'hotels', hotelId, 'notifications', id)
                batch.update(docRef, { is_read: true })
            })
            await batch.commit()
        } catch (error: any) {
            console.error("Error marking all notifications as read:", error)
        }
    },

    removeNotification: async (hotelId, notificationId) => {
        try {
            if (hotelId === 'demo-hotel-id') {
                const notifications = get().notifications.filter(item => item.id !== notificationId)
                set({ notifications, unreadCount: notifications.filter(item => !item.is_read).length })
                return
            }
            const docRef = doc(db, 'hotels', hotelId, 'notifications', notificationId)
            await deleteDoc(docRef)
        } catch (error) {
            console.error("Error removing notification:", error)
        }
    },

    clearAllNotifications: async (hotelId) => {
        const { notifications } = get()
        if (notifications.length === 0) return

        if (hotelId === 'demo-hotel-id') {
            set({ notifications: [], unreadCount: 0 })
            return
        }

        try {
            const batch = writeBatch(db)
            notifications.forEach(n => {
                const docRef = doc(db, 'hotels', hotelId, 'notifications', n.id)
                batch.delete(docRef)
            })
            await batch.commit()
        } catch (error: any) {
            console.error("Error clearing notifications:", error)
        }
    }
}))
