import { create } from 'zustand'
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp,
    limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AnonymousComplaint } from '@/types'

interface FeedbackState {
    complaints: AnonymousComplaint[]
    loading: boolean
    error: string | null
}

interface FeedbackActions {
    subscribeToComplaints: (hotelId: string) => () => void
    submitComplaint: (hotelId: string, content: string) => Promise<void>
}

type FeedbackStore = FeedbackState & FeedbackActions

export const useFeedbackStore = create<FeedbackStore>((set) => ({
    complaints: [],
    loading: true,
    error: null,

    subscribeToComplaints: (hotelId) => {
        set({ loading: true, error: null })

        const feedbackRef = collection(db, 'hotels', hotelId, 'anonymous_feedback')
        const q = query(feedbackRef, orderBy('timestamp', 'desc'), limit(100))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: AnonymousComplaint[] = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    hotel_id: hotelId,
                    content: data.content,
                    timestamp: (data.timestamp as Timestamp)?.toDate() || new Date()
                }
            })

            set({ complaints: list, loading: false })
        }, (err) => {
            console.error("Feedback subscription error:", err)
            set({ error: err.message, loading: false })
        })

        return unsubscribe
    },

    submitComplaint: async (hotelId, content) => {
        try {
            const feedbackRef = collection(db, 'hotels', hotelId, 'anonymous_feedback')
            // No user info added to maintain anonymity
            await addDoc(feedbackRef, {
                content,
                timestamp: serverTimestamp()
            })
        } catch (error: any) {
            console.error("Error submitting feedback:", error)
            throw error
        }
    }
}))
