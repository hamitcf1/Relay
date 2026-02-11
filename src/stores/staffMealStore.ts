import { create } from 'zustand'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyMenu } from '@/types'

interface StaffMealState {
    todayMenu: DailyMenu | null
    loading: boolean
    error: string | null
}

interface StaffMealActions {
    subscribeToTodayMenu: (hotelId: string) => () => void
    updateMenu: (hotelId: string, menu: string, userId: string, userName: string) => Promise<void>
}

type StaffMealStore = StaffMealState & StaffMealActions

export const useStaffMealStore = create<StaffMealStore>((set) => ({
    // State
    todayMenu: null,
    loading: true,
    error: null,

    // Actions
    subscribeToTodayMenu: (hotelId: string) => {
        set({ loading: true, error: null })

        // Use local date (YYYY-MM-DD) for menu tracking to avoid timezone shifts
        const today = new Date().toLocaleDateString('sv-SE')
        const menuRef = doc(db, 'hotels', hotelId, 'daily_menu', today)

        // Mock Menu for Live Demo
        if (hotelId === 'demo-hotel-id') {
            set({
                todayMenu: {
                    id: 'demo-menu',
                    hotel_id: 'demo-hotel-id',
                    date: today,
                    menu: 'Grilled Chicken with Rice\nLentil Soup\nSalad',
                    updated_at: new Date(),
                    updated_by: 'demo-user-gm',
                    updated_by_name: 'Manager',
                },
                loading: false,
                error: null,
            })
            return () => { }
        }

        const unsubscribe = onSnapshot(
            menuRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data()
                    set({
                        todayMenu: {
                            id: snapshot.id,
                            hotel_id: hotelId,
                            date: today,
                            menu: data.menu || '',
                            updated_at: data.updated_at?.toDate() || new Date(),
                            updated_by: data.updated_by || '',
                            updated_by_name: data.updated_by_name || '',
                        },
                        loading: false,
                        error: null,
                    })
                } else {
                    set({ todayMenu: null, loading: false })
                }
            },
            (error) => {
                console.error('Error subscribing to today menu:', error)
                set({ error: error.message, loading: false })
            }
        )

        return unsubscribe
    },

    updateMenu: async (hotelId: string, menu: string, userId: string, userName: string) => {
        try {
            const today = new Date().toLocaleDateString('sv-SE')
            const menuRef = doc(db, 'hotels', hotelId, 'daily_menu', today)

            await setDoc(menuRef, {
                menu,
                updated_at: serverTimestamp(),
                updated_by: userId,
                updated_by_name: userName,
            }, { merge: true })
        } catch (error) {
            console.error('Error updating menu:', error)
            throw error
        }
    },
}))
