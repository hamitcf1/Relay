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
    updateHotelSettings: (hotelId: string, settings: Partial<HotelSettings>) => Promise<void>
    joinHotelByCode: (code: string, user: any) => Promise<boolean>
    validateHotelCode: (code: string) => Promise<string | null>
    createNewHotel: (info: HotelInfo, user: any) => Promise<string | null>
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

        // Mock Data for Live Demo
        if (hotelId === 'demo-hotel-id') {
            set({
                hotel: {
                    id: 'demo-hotel-id',
                    code: 'DEMO123',
                    info: { name: 'Grand Relay Hotel', address: '123 Demo St, Tech City' },
                    settings: {
                        kbs_time: '23:00',
                        check_agency_intervals: [9, 12, 15, 18, 21],
                        staff_order: ['demo-user-gm', 'demo-user-staff'],
                    },
                },
                loading: false
            })
            return
        }

        try {
            const hotelRef = doc(db, 'hotels', hotelId)
            const hotelSnap = await getDoc(hotelRef)
            // ... rest of the code

            if (hotelSnap.exists()) {
                const data = hotelSnap.data()
                set({
                    hotel: {
                        id: hotelId,
                        code: data.code,
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

        // Mock Subscription for Live Demo
        if (hotelId === 'demo-hotel-id') {
            set({
                hotel: {
                    id: 'demo-hotel-id',
                    code: 'DEMO123',
                    info: { name: 'Grand Relay Hotel', address: '123 Demo St, Tech City' },
                    settings: {
                        kbs_time: '23:00',
                        check_agency_intervals: [9, 12, 15, 18, 21],
                        staff_order: ['demo-user-gm', 'demo-user-staff'],
                    },
                },
                loading: false,
                error: null,
            })
            return () => { } // no-op unsubscribe
        }

        const hotelRef = doc(db, 'hotels', hotelId)

        const unsubscribe = onSnapshot(
            hotelRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data()
                    set({
                        hotel: {
                            id: hotelId,
                            code: data.code,
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
    updateHotelSettings: async (hotelId: string, settings: Partial<HotelSettings>) => {
        try {
            const hotelRef = doc(db, 'hotels', hotelId)
            await setDoc(hotelRef, {
                settings
            }, { merge: true })
        } catch (error) {
            console.error('Error updating hotel settings:', error)
            throw error
        }
    },

    joinHotelByCode: async (code, user) => {
        try {
            const { collection, query, where, getDocs, updateDoc, arrayUnion, doc: firestoreDoc } = await import('firebase/firestore')

            const hotelsRef = collection(db, 'hotels')
            const q = query(hotelsRef, where('code', '==', code))
            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                return false
            }

            const hotelDoc = snapshot.docs[0]
            const hotelId = hotelDoc.id

            const hotelRef = firestoreDoc(db, 'hotels', hotelId)
            await updateDoc(hotelRef, {
                staff_list: arrayUnion(user.uid)
            })

            const userRef = firestoreDoc(db, 'users', user.uid)
            await setDoc(userRef, { hotel_id: hotelId }, { merge: true })

            return true
        } catch (error) {
            console.error("Error joining hotel:", error)
            throw error
        }
    },

    validateHotelCode: async (code: string) => {
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore')
            const hotelsRef = collection(db, 'hotels')
            const q = query(hotelsRef, where('code', '==', code))
            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                return null
            }

            return snapshot.docs[0].id
        } catch (error) {
            console.error("Error validating hotel code:", error)
            return null
        }
    },

    createNewHotel: async (info, user) => {
        try {
            const generateCode = () => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
                let result = ''
                for (let i = 0; i < 6; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length))
                }
                return result
            }

            const code = generateCode()

            // Create hotel document
            const hotelRef = await import('firebase/firestore').then(m => m.addDoc(m.collection(db, 'hotels'), {
                info,
                code,
                settings: defaultSettings,
                staff_list: [user.uid],
                owner_id: user.uid,
                created_at: m.serverTimestamp()
            }))

            // Update user
            const userRef = doc(db, 'users', user.uid)
            await setDoc(userRef, { hotel_id: hotelRef.id }, { merge: true })

            return hotelRef.id
        } catch (error) {
            console.error("Error creating hotel:", error)
            return null
        }
    }
}))
