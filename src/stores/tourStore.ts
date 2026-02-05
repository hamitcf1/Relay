import { create } from 'zustand'
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    limit,
    deleteDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Tour } from '@/types'

interface TourState {
    tours: Tour[]
    loading: boolean
    error: string | null
}

interface TourActions {
    subscribeToTours: (hotelId: string) => () => void
    addTour: (hotelId: string, tour: Omit<Tour, 'id'>) => Promise<void>
    updateTour: (hotelId: string, tourId: string, updates: Partial<Tour>) => Promise<void>
    deleteTour: (hotelId: string, tourId: string) => Promise<void>
    toggleTourActive: (hotelId: string, tourId: string, isActive: boolean) => Promise<void>
}

type TourStore = TourState & TourActions

export const useTourStore = create<TourStore>((set) => ({
    tours: [],
    loading: true,
    error: null,

    subscribeToTours: (hotelId) => {
        set({ loading: true, error: null })

        const toursRef = collection(db, 'hotels', hotelId, 'tours')
        const q = query(toursRef, limit(50))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Tour[] = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    base_price_eur: data.base_price_eur || 0,
                    adult_price: data.adult_price || 0,
                    child_3_7_price: data.child_3_7_price || 0,
                    child_0_3_price: data.child_0_3_price || 0,
                    operating_days: data.operating_days || [],
                    is_active: data.is_active ?? true
                }
            })

            set({ tours: list, loading: false })
        }, (err) => {
            console.error("Tour subscription error:", err)
            set({ error: err.message, loading: false })
        })

        return unsubscribe
    },

    addTour: async (hotelId, tourData) => {
        try {
            const toursRef = collection(db, 'hotels', hotelId, 'tours')
            await addDoc(toursRef, tourData)
        } catch (error: any) {
            console.error("Error adding tour:", error)
            throw error
        }
    },

    updateTour: async (hotelId, tourId, updates) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'tours', tourId)
            await updateDoc(docRef, updates)
        } catch (error: any) {
            console.error("Error updating tour:", error)
            throw error
        }
    },

    deleteTour: async (hotelId, tourId) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'tours', tourId)
            await deleteDoc(docRef)
        } catch (error: any) {
            console.error("Error deleting tour:", error)
            throw error
        }
    },

    toggleTourActive: async (hotelId, tourId, isActive) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'tours', tourId)
            await updateDoc(docRef, { is_active: isActive })
        } catch (error: any) {
            console.error("Error toggling tour status:", error)
            throw error
        }
    }
}))
