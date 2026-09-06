import { create } from 'zustand'
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    query,
    where,
    limit,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Shift, ShiftType } from '@/types'
import { useAuthStore } from './authStore'
import { useActivityStore } from './activityStore'

interface ShiftState {
    currentShift: Shift | null
    loading: boolean
    error: string | null
}

interface ShiftActions {
    subscribeToCurrentShift: (hotelId: string) => () => void
    startShift: (hotelId: string, staffIds: string[], type: ShiftType, date?: string) => Promise<void>
    endShift: (hotelId: string, handoverNote: string) => Promise<void>
    updateCompliance: (hotelId: string, field: 'kbs_checked' | 'agency_msg_checked_count', value: boolean | number) => Promise<void>
}

type ShiftStore = ShiftState & ShiftActions




export const useShiftStore = create<ShiftStore>((set, get) => ({
    // State
    currentShift: null,
    loading: true,
    error: null,

    // Actions
    subscribeToCurrentShift: (hotelId: string) => {
        set({ loading: true, error: null })

        // Mock Shift for Live Demo
        if (hotelId === 'demo-hotel-id') {
            set({
                currentShift: {
                    shift_id: 'DEMO_SHIFT_A',
                    date: new Date().toISOString().split('T')[0],
                    type: 'A',
                    staff_ids: ['demo-user-gm', 'demo-user-staff'],
                    compliance: { kbs_checked: true, agency_msg_checked_count: 3 },
                    handover_note: 'Room 101 AC fixed. VIP arrival in 204 at 14:00.',
                    status: 'active',
                },
                loading: false,
                error: null
            })
            return () => { } // no-op unsubscribe
        }

        // Query for active shift
        const shiftsRef = collection(db, 'hotels', hotelId, 'shifts')
        const activeShiftQuery = query(
            shiftsRef,
            where('status', '==', 'active'),
            limit(1)
        )

        const unsubscribe = onSnapshot(
            activeShiftQuery,
            (snapshot) => {
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0]
                    const data = doc.data()

                    set({
                        currentShift: {
                            shift_id: doc.id,
                            date: data.date,
                            type: data.type,
                            staff_ids: data.staff_ids || [],
                            compliance: data.compliance || { kbs_checked: false, agency_msg_checked_count: 0 },
                            handover_note: data.handover_note || '',
                            status: data.status,
                        },
                        loading: false,
                    })
                } else {
                    set({ currentShift: null, loading: false })
                }
            },
            (error) => {
                console.error('Error subscribing to shift:', error)
                set({ error: error.message, loading: false })
            }
        )

        return unsubscribe
    },

    startShift: async (hotelId: string, staffIds: string[], type: ShiftType, date?: string) => {
        const today = date || new Date().toLocaleDateString('sv-SE')
        const shiftId = `${today}_SHIFT_${type}`

        try {
            const shiftRef = doc(db, 'hotels', hotelId, 'shifts', shiftId)
            const snap = await getDoc(shiftRef)
            if (snap.exists()) return // Already started manually or by another client

            await setDoc(shiftRef, {
                shift_id: shiftId,
                date: today,
                type,
                staff_ids: staffIds,
                compliance: {
                    kbs_checked: false,
                    agency_msg_checked_count: 0,
                },
                handover_note: '',
                status: 'active',
                started_at: serverTimestamp(),
            })

            // Log activity
            const user = useAuthStore.getState().user
            if (user) {
                useActivityStore.getState().logActivity(
                    hotelId, user.uid, user.name, user.role,
                    'shift_start', `Shift ${type}`
                )
            }

        } catch (error) {
            console.error('Error starting shift:', error)
            throw error
        }
    },

    endShift: async (hotelId: string, handoverNote: string) => {
        const { currentShift } = get()

        if (!currentShift) {
            throw new Error('No active shift')
        }

        try {
            const shiftRef = doc(db, 'hotels', hotelId, 'shifts', currentShift.shift_id)

            await updateDoc(shiftRef, {
                handover_note: handoverNote,
                status: 'closed',
                ended_at: serverTimestamp(),
            })

            // Log activity
            const user = useAuthStore.getState().user
            if (user) {
                useActivityStore.getState().logActivity(
                    hotelId, user.uid, user.name, user.role,
                    'shift_end', `Shift ${currentShift.type}`
                )
            }

        } catch (error) {
            console.error('Error ending shift:', error)
            throw error
        }
    },

    updateCompliance: async (hotelId: string, field: 'kbs_checked' | 'agency_msg_checked_count', value: boolean | number) => {
        const { currentShift } = get()

        if (!currentShift) {
            throw new Error('No active shift')
        }

        try {
            const shiftRef = doc(db, 'hotels', hotelId, 'shifts', currentShift.shift_id)

            await updateDoc(shiftRef, {
                [`compliance.${field}`]: value,
            })

        } catch (error) {
            console.error('Error updating compliance:', error)
            throw error
        }
    },
}))
