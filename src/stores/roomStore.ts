import { create } from 'zustand'
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Room, RoomStatus, RoomOccupancy } from '@/types'

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
}

export const useRoomStore = create<RoomState>((set) => ({
    rooms: [],
    loading: false,
    error: null,

    subscribeToRooms: (hotelId) => {
        set({ loading: true })
        const roomsRef = collection(db, 'hotels', hotelId, 'rooms')
        // Sort by room number by default
        const q = query(roomsRef, orderBy('number', 'asc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Room[]

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
            await addDoc(roomsRef, roomData)
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
            await updateDoc(roomRef, updates)
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

    updateMultipleRooms: async (hotelId, roomIds, updates) => {
        try {
            const { writeBatch } = await import('firebase/firestore')
            const batch = writeBatch(db)

            for (const roomId of roomIds) {
                const roomRef = doc(db, 'hotels', hotelId, 'rooms', roomId)
                batch.update(roomRef, updates)
            }

            await batch.commit()
        } catch (error: any) {
            set({ error: error.message })
        }
    }
}))
