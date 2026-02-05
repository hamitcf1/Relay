import { create } from 'zustand'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Event types for hotel operations
export type CalendarEventType =
    | 'checkout'     // Guest checkout
    | 'arrival'      // Guest arrival
    | 'meeting'      // Staff meeting
    | 'inspection'   // Hotel inspection
    | 'delivery'     // Supply delivery
    | 'maintenance'  // Scheduled maintenance
    | 'reminder'     // General reminder
    | 'tour'         // Tour sales/booking
    | 'transfer'     // Transfer sales/booking
    | 'off_day'      // Staff off-day

export interface CalendarEvent {
    id: string
    type: CalendarEventType
    title: string
    description: string | null
    date: Date
    time: string | null  // Optional time (HH:MM format)
    room_number: string | null
    total_price: number | null
    collected_amount: number | null
    currency?: string
    created_by: string
    created_by_name: string
    created_at: Date
    is_completed: boolean
}

interface CalendarState {
    events: CalendarEvent[]
    loading: boolean
    error: string | null
}

interface CalendarActions {
    subscribeToEvents: (hotelId: string, startDate: Date, endDate: Date) => () => void
    addEvent: (hotelId: string, event: Omit<CalendarEvent, 'id' | 'created_at' | 'is_completed'>) => Promise<void>
    updateEvent: (hotelId: string, eventId: string, updates: Partial<CalendarEvent>) => Promise<void>
    deleteEvent: (hotelId: string, eventId: string) => Promise<void>
    toggleComplete: (hotelId: string, eventId: string, isCompleted: boolean) => Promise<void>
}

type CalendarStore = CalendarState & CalendarActions

const convertTimestamp = (timestamp: Timestamp | Date | null): Date => {
    if (!timestamp) return new Date()
    if (timestamp instanceof Timestamp) return timestamp.toDate()
    return timestamp
}

export const useCalendarStore = create<CalendarStore>((set) => ({
    events: [],
    loading: true,
    error: null,

    subscribeToEvents: (hotelId: string, startDate: Date, endDate: Date) => {
        set({ loading: true, error: null })

        const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')
        const eventsQuery = query(
            eventsRef,
            where('date', '>=', Timestamp.fromDate(startDate)),
            where('date', '<=', Timestamp.fromDate(endDate)),
            orderBy('date', 'asc')
        )

        const unsubscribe = onSnapshot(
            eventsQuery,
            (snapshot) => {
                const eventsList: CalendarEvent[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        type: data.type as CalendarEventType,
                        title: data.title,
                        description: data.description || null,
                        date: convertTimestamp(data.date),
                        time: data.time || null,
                        room_number: data.room_number || null,
                        total_price: data.total_price ?? data.price ?? null, // Fallback for migration
                        collected_amount: data.collected_amount ?? 0,
                        currency: data.currency,
                        created_by: data.created_by,
                        created_by_name: data.created_by_name || 'Unknown',
                        created_at: convertTimestamp(data.created_at),
                        is_completed: data.is_completed || false,
                    }
                })

                set({ events: eventsList, loading: false, error: null })
            },
            (error) => {
                console.error('Error subscribing to calendar:', error)
                set({ error: error.message, loading: false })
            }
        )

        return unsubscribe
    },

    addEvent: async (hotelId, eventData) => {
        try {
            const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')
            await addDoc(eventsRef, {
                ...eventData,
                date: Timestamp.fromDate(eventData.date),
                created_at: serverTimestamp(),
                is_completed: false,
            })
        } catch (error) {
            console.error('Error adding event:', error)
            throw error
        }
    },

    updateEvent: async (hotelId, eventId, updates) => {
        try {
            const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', eventId)
            const updateData: any = { ...updates }
            if (updates.date) {
                updateData.date = Timestamp.fromDate(updates.date)
            }
            // Ensure numeric fields are preserved correctly if passed
            if (updates.total_price !== undefined) updateData.total_price = updates.total_price
            if (updates.collected_amount !== undefined) updateData.collected_amount = updates.collected_amount

            await updateDoc(eventRef, updateData)
        } catch (error) {
            console.error('Error updating event:', error)
            throw error
        }
    },

    deleteEvent: async (hotelId, eventId) => {
        try {
            const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', eventId)
            await deleteDoc(eventRef)
        } catch (error) {
            console.error('Error deleting event:', error)
            throw error
        }
    },

    toggleComplete: async (hotelId, eventId, isCompleted) => {
        try {
            const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', eventId)
            await updateDoc(eventRef, { is_completed: isCompleted })
        } catch (error) {
            console.error('Error toggling complete:', error)
            throw error
        }
    },
}))

// Event type display info
export const eventTypeInfo: Record<CalendarEventType, { label: string; color: string; icon: string }> = {
    checkout: { label: 'Checkout', color: 'bg-amber-500', icon: '🚪' },
    arrival: { label: 'Arrival', color: 'bg-emerald-500', icon: '🏨' },
    meeting: { label: 'Meeting', color: 'bg-indigo-500', icon: '👥' },
    inspection: { label: 'Inspection', color: 'bg-rose-500', icon: '🔍' },
    delivery: { label: 'Delivery', color: 'bg-purple-500', icon: '📦' },
    maintenance: { label: 'Maintenance', color: 'bg-orange-500', icon: '🔧' },
    reminder: { label: 'Reminder', color: 'bg-zinc-500', icon: '⏰' },
    tour: { label: 'Tour', color: 'bg-fuchsia-500', icon: '🗺️' },
    transfer: { label: 'Transfer', color: 'bg-sky-500', icon: '🚐' },
    off_day: { label: 'Off Day', color: 'bg-indigo-500', icon: '🌴' },
}
