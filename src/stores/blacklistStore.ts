import { create } from 'zustand'
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    orderBy,
    updateDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { type BlacklistedGuest } from '@/types'

interface BlacklistState {
    blacklistedGuests: BlacklistedGuest[]
    loading: boolean
    error: string | null
    subscribeToBlacklist: (hotelId: string) => () => void
    addBlacklistedGuest: (hotelId: string, data: Omit<BlacklistedGuest, 'id' | 'created_at'>) => Promise<void>
    updateBlacklistedGuest: (hotelId: string, guestId: string, data: Partial<Omit<BlacklistedGuest, 'id' | 'created_at'>>) => Promise<void>
    removeBlacklistedGuest: (hotelId: string, guestId: string) => Promise<void>
}

export const useBlacklistStore = create<BlacklistState>((set) => ({
    blacklistedGuests: [],
    loading: false,
    error: null,

    subscribeToBlacklist: (hotelId: string) => {
        set({ loading: true, error: null })
        const blacklistRef = collection(db, 'hotels', hotelId, 'blacklists')
        const q = query(blacklistRef, orderBy('created_at', 'desc'))

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const guests = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        ...data,
                        created_at: data.created_at?.toDate() || new Date(),
                    } as BlacklistedGuest
                })
                set({ blacklistedGuests: guests, loading: false })
            },
            (error) => {
                console.error('Error subscribing to blacklist:', error)
                set({ error: error.message, loading: false })
            }
        )

        return unsubscribe
    },

    addBlacklistedGuest: async (hotelId: string, data: Omit<BlacklistedGuest, 'id' | 'created_at'>) => {
        try {
            const blacklistRef = collection(db, 'hotels', hotelId, 'blacklists')
            const newDocRef = doc(blacklistRef)
            await setDoc(newDocRef, {
                ...data,
                created_at: serverTimestamp()
            })
        } catch (error: any) {
            console.error('Error adding blacklisted guest:', error)
            throw error
        }
    },

    updateBlacklistedGuest: async (hotelId: string, guestId: string, data: Partial<Omit<BlacklistedGuest, 'id' | 'created_at'>>) => {
        try {
            const guestRef = doc(db, 'hotels', hotelId, 'blacklists', guestId)
            await updateDoc(guestRef, {
                ...data
            })
        } catch (error: any) {
            console.error('Error updating blacklisted guest:', error)
            throw error
        }
    },

    removeBlacklistedGuest: async (hotelId: string, guestId: string) => {
        try {
            const guestRef = doc(db, 'hotels', hotelId, 'blacklists', guestId)
            await deleteDoc(guestRef)
        } catch (error: any) {
            console.error('Error removing blacklisted guest:', error)
            throw error
        }
    }
}))
