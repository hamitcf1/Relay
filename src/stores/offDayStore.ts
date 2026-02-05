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
    updateRequestStatus: (hotelId: string, requestId: string, status: OffDayStatus, gmUid: string) => Promise<void>
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
            q = query(requestsRef, where('staff_id', '==', staffId), orderBy('created_at', 'desc'), limit(50))
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
                    processed_by: data.processed_by
                }
            })

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
    }
}))
