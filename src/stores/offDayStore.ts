import { create } from 'zustand'
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp,
    deleteDoc,
    limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { OffDayRequest, OffDayStatus } from '@/types'

interface OffDayState {
    requests: OffDayRequest[]
    loading: boolean
    error: string | null
}

interface OffDayActions {
    subscribeToRequests: (hotelId: string, staffId?: string) => () => void
    submitRequest: (hotelId: string, request: Omit<OffDayRequest, 'id' | 'status' | 'created_at'>) => Promise<void>
    updateRequest: (hotelId: string, requestId: string, updates: Partial<OffDayRequest>) => Promise<void>
    updateRequestStatus: (hotelId: string, requestId: string, status: OffDayStatus, gmUid: string) => Promise<void>
    deleteRequest: (hotelId: string, requestId: string) => Promise<void>
    cancelRequest: (hotelId: string, requestId: string) => Promise<void>
}

type OffDayStore = OffDayState & OffDayActions

export const useOffDayStore = create<OffDayStore>((set) => ({
    requests: [],
    loading: true,
    error: null,

    subscribeToRequests: (hotelId, staffId) => {
        set({ loading: true, error: null })

        const requestsRef = collection(db, 'hotels', hotelId, 'off_day_requests')
        let q = query(requestsRef, orderBy('created_at', 'desc'), limit(100))

        if (staffId) {
            // Remove orderBy to avoid needing a composite index (staff_id + created_at)
            // We will sort client-side in the snapshot listener
            // User sees ALL their requests
            q = query(requestsRef, where('staff_id', '==', staffId))
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: OffDayRequest[] = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    staff_id: data.staff_id,
                    staff_name: data.staff_name,
                    date: data.date,
                    reason: data.reason,
                    status: data.status as OffDayStatus,
                    created_at: (data.created_at as Timestamp)?.toDate() || new Date(),
                    processed_at: data.processed_at ? (data.processed_at as Timestamp).toDate() : undefined,
                    processed_by: data.processed_by,
                    type: data.type || 'off_day',
                    shift_name: data.shift_name
                }
            })

            // Sort client-side (descending)
            list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

            set({ requests: list, loading: false })
            set({ requests: list, loading: false })
        }, (err) => {
            console.error("Off-day subscription error:", err)
            set({ error: err.message, loading: false })
        })

        return unsubscribe
    },

    submitRequest: async (hotelId, requestData) => {
        try {
            const requestsRef = collection(db, 'hotels', hotelId, 'off_day_requests')
            await addDoc(requestsRef, {
                ...requestData,
                status: 'pending',
                created_at: serverTimestamp()
            })
        } catch (error: any) {
            console.error("Error submitting off-day request:", error)
            throw error
        }
    },

    updateRequest: async (hotelId, requestId, updates) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'off_day_requests', requestId)
            await updateDoc(docRef, {
                ...updates,
                updated_at: serverTimestamp() // Optional: add updated_at field
            })
        } catch (error: any) {
            console.error("Error updating off-day request:", error)
            throw error
        }
    },

    updateRequestStatus: async (hotelId, requestId, status, gmUid) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'off_day_requests', requestId)
            await updateDoc(docRef, {
                status,
                processed_at: serverTimestamp(),
                processed_by: gmUid
            })
        } catch (error: any) {
            console.error("Error updating off-day status:", error)
            throw error
        }
    },

    deleteRequest: async (hotelId, requestId) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'off_day_requests', requestId)
            await deleteDoc(docRef)
        } catch (error: any) {
            console.error("Error deleting off-day request:", error)
            throw error
        }
    },

    cancelRequest: async (hotelId, requestId) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'off_day_requests', requestId)
            // We delete it if it's just a cancel, or we COULD mark it as cancelled.
            // Requirement says "removable completely" for GM, but for user "cancel own requests".
            // Usually cancel means "delete" if pending, or "mark cancelled" if approved.
            // But let's assume for now if it's pending, we plain delete it or mark it 'cancelled' status?
            // The prompt says "they are removable completely".
            // Let's stick to simple DELETE for now if it's pending.
            // Wait, "Off day requests can be declined or approved ... but they cannot be deleted by GM's. they should be removable completely."
            // So GM needs delete.
            // "Users should be able to cancel off day requests".
            // If I just delete it, it's gone.
            // Let's implement delete for both for now, as that seems to be the core request "removable completely".
            await deleteDoc(docRef)
        } catch (error: any) {
            console.error("Error cancelling off-day request:", error)
            throw error
        }
    }
}))
