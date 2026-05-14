import { create } from 'zustand'
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Room, RoomStatus, RoomOccupancy, RoomLoan, LoanItemPreset } from '@/types'

interface RoomState {
    rooms: Room[]
    loading: boolean
    error: string | null
    subscribeToRooms: (hotelId: string) => () => void
    addRoom: (hotelId: string, room: Omit<Room, 'id'>) => Promise<void>
    updateRoomStatus: (hotelId: string, roomId: string, status: RoomStatus) => Promise<void>
    updateRoomOccupancy: (hotelId: string, roomId: string, occupancy: RoomOccupancy) => Promise<void>
    updateRoom: (hotelId: string, roomId: string, updates: Partial<Room>) => Promise<void>
    deleteRoom: (hotelId: string, roomId: string) => Promise<void>
    updateMultipleRooms: (hotelId: string, roomIds: string[], updates: Partial<Room>) => Promise<void>
    setKeyCardCount: (hotelId: string, roomId: string, count: number) => Promise<void>
    addLoan: (hotelId: string, roomId: string, loan: {
        item: LoanItemPreset
        label?: string
        qty: number
        lent_by?: string
        lent_by_name?: string
    }) => Promise<void>
    returnLoan: (hotelId: string, roomId: string, loanId: string, returnedByName?: string) => Promise<void>
    resetRoomBorrowables: (hotelId: string, roomId: string) => Promise<void>
}

function generateLoanId(): string {
    return `loan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useRoomStore = create<RoomState>((set) => ({
    rooms: [],
    loading: false,
    error: null,

    subscribeToRooms: (hotelId) => {
        set({ loading: true })

        // Mock Rooms for Live Demo
        if (hotelId === 'demo-hotel-id') {
            const mockRooms: Room[] = [
                { id: '101', number: '101', type: 'standard', status: 'dirty', occupancy: 'vacant', floor: 1 },
                { id: '102', number: '102', type: 'standard', status: 'clean', occupancy: 'occupied', floor: 1 },
                { id: '201', number: '201', type: 'corner', status: 'inspect', occupancy: 'occupied', floor: 2 },
                { id: '204', number: '204', type: 'teras_suite', status: 'clean', occupancy: 'vacant', floor: 2 },
            ]
            set({ rooms: mockRooms, loading: false })
            return () => { }
        }

        const roomsRef = collection(db, 'hotels', hotelId, 'rooms')
        // Sort by room number by default
        const q = query(roomsRef, orderBy('number', 'asc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rooms = snapshot.docs.map(doc => {
                const data = doc.data() as any
                // Convert Firestore Timestamps inside active_loans back to Date so the UI can format them
                if (Array.isArray(data.active_loans)) {
                    data.active_loans = data.active_loans.map((l: any) => ({
                        ...l,
                        lent_at: l.lent_at?.toDate ? l.lent_at.toDate() : l.lent_at,
                        returned_at: l.returned_at?.toDate ? l.returned_at.toDate() : l.returned_at,
                    }))
                }
                return { id: doc.id, ...data }
            }) as Room[]

            // Custom sort if numbers are strings but numeric (e.g. "101", "102") to avoid "10, 100, 11"
            rooms.sort((a, b) => {
                const numA = parseInt(a.number)
                const numB = parseInt(b.number)
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB
                }
                return a.number.localeCompare(b.number)
            })

            set({ rooms, loading: false })
        }, (error) => {
            console.error('Error fetching rooms:', error)
            set({ error: error.message, loading: false })
        })

        return unsubscribe
    },

    addRoom: async (hotelId, roomData) => {
        try {
            const roomsRef = collection(db, 'hotels', hotelId, 'rooms')
            // Clean undefined
            const cleanData = Object.entries(roomData).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v
                return acc
            }, {} as any)
            await addDoc(roomsRef, cleanData)
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    updateRoomStatus: async (hotelId, roomId, status) => {
        try {
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await updateDoc(roomRef, { status })
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    updateRoomOccupancy: async (hotelId, roomId, occupancy) => {
        try {
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await updateDoc(roomRef, { occupancy })
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    updateRoom: async (hotelId, roomId, updates) => {
        try {
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            // Clean undefined
            const cleanUpdates = Object.entries(updates).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v
                return acc
            }, {} as any)
            await updateDoc(roomRef, cleanUpdates)
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    deleteRoom: async (hotelId, roomId) => {
        try {
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await deleteDoc(roomRef)
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    setKeyCardCount: async (hotelId, roomId, count) => {
        try {
            const safe = Math.max(0, Math.floor(count))
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await updateDoc(roomRef, { key_card_count: safe })
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    addLoan: async (hotelId, roomId, loan) => {
        try {
            const room = useRoomStore.getState().rooms.find(r => r.id === roomId)
            if (!room) throw new Error('Room not found')
            const newLoan: RoomLoan = {
                id: generateLoanId(),
                item: loan.item,
                label: loan.label?.trim() || undefined,
                qty: Math.max(1, Math.floor(loan.qty)),
                lent_at: new Date(),
                lent_by: loan.lent_by,
                lent_by_name: loan.lent_by_name,
                returned_at: null,
            }
            // Strip undefined so Firestore doesn't reject the payload
            const cleanLoan = Object.fromEntries(
                Object.entries(newLoan).filter(([, v]) => v !== undefined)
            )
            // Use Firestore Timestamp for date persistence
            const firestoreLoan = { ...cleanLoan, lent_at: Timestamp.fromDate(newLoan.lent_at) }
            const existing = (room.active_loans ?? []).map(l => ({
                ...l,
                lent_at: l.lent_at instanceof Date ? Timestamp.fromDate(l.lent_at) : l.lent_at,
                returned_at:
                    l.returned_at instanceof Date ? Timestamp.fromDate(l.returned_at) : l.returned_at,
            }))
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await updateDoc(roomRef, { active_loans: [...existing, firestoreLoan] })
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    returnLoan: async (hotelId, roomId, loanId, returnedByName) => {
        try {
            const room = useRoomStore.getState().rooms.find(r => r.id === roomId)
            if (!room) throw new Error('Room not found')
            // Returned loans are dropped from active_loans (history view comes later if needed)
            const remaining = (room.active_loans ?? [])
                .filter(l => l.id !== loanId)
                .map(l => ({
                    ...l,
                    lent_at: l.lent_at instanceof Date ? Timestamp.fromDate(l.lent_at) : l.lent_at,
                    returned_at:
                        l.returned_at instanceof Date ? Timestamp.fromDate(l.returned_at) : l.returned_at,
                }))
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await updateDoc(roomRef, { active_loans: remaining })
            void returnedByName // currently unused; reserved for future audit log
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    resetRoomBorrowables: async (hotelId, roomId) => {
        try {
            const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
            await updateDoc(roomRef, { key_card_count: 0, active_loans: [] })
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    updateMultipleRooms: async (hotelId, roomIds, updates) => {
        try {
            const { writeBatch } = await import('firebase/firestore')
            const batch = writeBatch(db)

            // Clean undefined
            const cleanUpdates = Object.entries(updates).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v
                return acc
            }, {} as any)

            for (const roomId of roomIds) {
                const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
                batch.update(roomRef, cleanUpdates)
            }

            await batch.commit()
        } catch (error: any) {
            set({ error: error.message })
        }
    }
}))
