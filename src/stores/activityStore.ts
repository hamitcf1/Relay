import { create } from 'zustand'
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ActivityAction, UserRole } from '@/types'

export interface ActivityLogEntry {
    id: string
    user_id: string
    user_name: string
    user_role: UserRole
    action: ActivityAction
    details?: string
    timestamp: Timestamp
}

interface ActivityState {
    logs: ActivityLogEntry[]
    loading: boolean
}

interface ActivityActions {
    logActivity: (
        hotelId: string,
        userId: string,
        userName: string,
        userRole: UserRole,
        action: ActivityAction,
        details?: string
    ) => Promise<void>
    subscribeToActivityLogs: (hotelId: string) => () => void
}

type ActivityStore = ActivityState & ActivityActions

export const useActivityStore = create<ActivityStore>((set) => ({
    logs: [],
    loading: true,

    logActivity: async (hotelId, userId, userName, userRole, action, details) => {
        try {
            const colRef = collection(db, 'hotels', hotelId, 'activity_logs')
            await addDoc(colRef, {
                user_id: userId,
                user_name: userName,
                user_role: userRole,
                action,
                details: details || null,
                timestamp: Timestamp.now(),
            })
        } catch (error) {
            console.error('Failed to log activity:', error)
        }
    },

    subscribeToActivityLogs: (hotelId) => {
        set({ loading: true })
        const colRef = collection(db, 'hotels', hotelId, 'activity_logs')
        const q = query(colRef, orderBy('timestamp', 'desc'), limit(200))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs: ActivityLogEntry[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as ActivityLogEntry[]
            set({ logs, loading: false })
        }, (error) => {
            console.error('Activity logs subscription error:', error)
            set({ loading: false })
        })

        return unsubscribe
    },
}))
