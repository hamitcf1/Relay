import { create } from 'zustand'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Hotel, HotelInfo, HotelSettings } from '@/types'

interface HotelState {
    hotel: Hotel | null
    loading: boolean
    error: string | null
}

interface HotelActions {
    loadHotel: (hotelId: string) => Promise<void>
    subscribeToHotel: (hotelId: string) => () => void
    createHotelIfNotExists: (hotelId: string, info: HotelInfo) => Promise<void>
    updateStaffOrder: (hotelId: string, order: string[]) => Promise<void>
}

type HotelStore = HotelState & HotelActions

// Default hotel settings
const defaultSettings: HotelSettings = {
    kbs_time: '23:00',
    check_agency_intervals: [9, 12, 15, 18, 21],
}

export const useHotelStore = create<HotelStore>((set) => ({
    // State
    hotel: null,
    loading: true,
    error: null,

    // Actions
    loadHotel: async (hotelId: string) => {
        set({ loading: true, error: null })

        try {
            const hotelRef = doc(db, 'hotels', hotelId)
            const hotelSnap = await getDoc(hotelRef)

            if (hotelSnap.exists()) {
                const data = hotelSnap.data()
                set({
                    hotel: {
                        id: hotelId,
                        info: data.info || { name: 'Hotel', address: '' },
                        settings: data.settings || defaultSettings,
                    },
                    loading: false,
                })
            } else {
                set({
                    hotel: null,
                    loading: false,
                    error: 'Hotel not found'
                })
            }
        } catch (error) {
            console.error('Error loading hotel:', error)
            set({
                error: error instanceof Error ? error.message : 'Failed to load hotel',
                loading: false
            })
        }
    },

    subscribeToHotel: (hotelId: string) => {
        set({ loading: true, error: null })

        const hotelRef = doc(db, 'hotels', hotelId)

        const unsubscribe = onSnapshot(
            hotelRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data()
                    set({
                        hotel: {
                            id: hotelId,
                            info: data.info || { name: 'Hotel', address: '' },
                            settings: data.settings || defaultSettings,
                        },
                        loading: false,
                        error: null,
                    })
                } else {
                    set({ hotel: null, loading: false })
                }
            },
            (error) => {
                console.error('Error subscribing to hotel:', error)
                set({ error: error.message, loading: false })
            }
        )

        return unsubscribe
    },

    createHotelIfNotExists: async (hotelId: string, info: HotelInfo) => {
        try {
            const hotelRef = doc(db, 'hotels', hotelId)
            const hotelSnap = await getDoc(hotelRef)

            if (!hotelSnap.exists()) {
                await setDoc(hotelRef, {
                    info,
                    settings: defaultSettings,
                })

                set({
                    hotel: {
                        id: hotelId,
                        info,
                        settings: defaultSettings,
                    },
                    loading: false,
                })
            }
        } catch (error) {
            console.error('Error creating hotel:', error)
            throw error
        }
    },
    updateStaffOrder: async (hotelId: string, order: string[]) => {
        try {
            const hotelRef = doc(db, 'hotels', hotelId)
            await setDoc(hotelRef, {
                settings: {
                    staff_order: order
                }
            }, { merge: true })
        } catch (error) {
            console.error('Error updating staff order:', error)
            throw error
        }
    },
}))
