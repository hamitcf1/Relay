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

        const unsubscribe = onSnapshot(q, (snapshot) => {
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
            const docRef = doc(db, 'hotels', hotelId, 'notifications', notificationId)
            await deleteDoc(docRef)
        } catch (error) {
            console.error("Error removing notification:", error)
        }
    }
}))
