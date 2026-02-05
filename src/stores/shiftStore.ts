import { create } from 'zustand'
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Shift, ShiftType, ShiftCompliance } from '@/types'

interface ShiftState {
    currentShift: Shift | null
    loading: boolean
    error: string | null
}

interface ShiftActions {
    subscribeToCurrentShift: (hotelId: string) => () => void
    startShift: (hotelId: string, userId: string, type: ShiftType, cashStart: number) => Promise<void>
    endShift: (hotelId: string, cashEnd: number, handoverNote: string) => Promise<void>
    updateCompliance: (hotelId: string, field: 'kbs_checked' | 'agency_msg_checked_count', value: boolean | number) => Promise<void>
}

type ShiftStore = ShiftState & ShiftActions

// Generate shift ID: "2026-02-05_SHIFT_A"
const generateShiftId = (type: ShiftType): string => {
    const today = new Date().toISOString().split('T')[0]
    return `${today}_SHIFT_${type}`
}



export const useShiftStore = create<ShiftStore>((set, get) => ({
    // State
    currentShift: null,
    loading: true,
    error: null,

    // Actions
    subscribeToCurrentShift: (hotelId: string) => {
        set({ loading: true, error: null })

        // Query for active shift
        const shiftsRef = collection(db, 'hotels', hotelId, 'shifts')
        const activeShiftQuery = query(
            shiftsRef,
            where('status', '==', 'active'),
            orderBy('date', 'desc'),
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
                            cash_start: data.cash_start || 0,
                            cash_end: data.cash_end || 0,
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

    startShift: async (hotelId: string, userId: string, type: ShiftType, cashStart: number) => {
        const shiftId = generateShiftId(type)
        const today = new Date().toISOString().split('T')[0]

        try {
            const shiftRef = doc(db, 'hotels', hotelId, 'shifts', shiftId)

            await setDoc(shiftRef, {
                shift_id: shiftId,
                date: today,
                type,
                staff_ids: [userId],
                compliance: {
                    kbs_checked: false,
                    agency_msg_checked_count: 0,
                },
                cash_start: cashStart,
                cash_end: 0,
                handover_note: '',
                status: 'active',
                started_at: serverTimestamp(),
            })

        } catch (error) {
            console.error('Error starting shift:', error)
            throw error
        }
    },

    endShift: async (hotelId: string, cashEnd: number, handoverNote: string) => {
        const { currentShift } = get()

        if (!currentShift) {
            throw new Error('No active shift')
        }

        try {
            const shiftRef = doc(db, 'hotels', hotelId, 'shifts', currentShift.shift_id)

            await updateDoc(shiftRef, {
                cash_end: cashEnd,
                handover_note: handoverNote,
                status: 'closed',
                ended_at: serverTimestamp(),
            })

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

// Helper to calculate compliance percentage
export const calculateCompliancePercentage = (compliance: ShiftCompliance): number => {
    let percentage = 0
    if (compliance.kbs_checked) percentage += 50
    if (compliance.agency_msg_checked_count > 0) percentage += 50
    return percentage
}
