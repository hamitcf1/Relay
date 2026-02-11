import { create } from 'zustand'
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Log, LogType, LogUrgency, LogStatus, LogInput } from '@/types'

interface LogsState {
    logs: Log[]
    pinnedLogs: Log[]
    loading: boolean
    error: string | null
    hotelId: string | null
}

interface LogsActions {
    setHotelId: (hotelId: string) => void
    subscribeToLogs: () => () => void
    addLog: (log: LogInput) => Promise<void>
    editLog: (id: string, updates: Partial<Log>) => Promise<void>
    updateLogStatus: (logId: string, status: LogStatus | 'archived') => Promise<void>
    togglePin: (logId: string, isPinned: boolean) => Promise<void>
    archiveLog: (logId: string) => Promise<void>
}

type LogsStore = LogsState & LogsActions

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null): Date => {
    if (!timestamp) return new Date()
    if (timestamp instanceof Timestamp) return timestamp.toDate()
    return timestamp
}

export const useLogsStore = create<LogsStore>((set, get) => ({
    // State
    logs: [],
    pinnedLogs: [],
    loading: true,
    error: null,
    hotelId: null,

    // Actions
    setHotelId: (hotelId: string) => {
        set({ hotelId })
    },

    subscribeToLogs: () => {
        const { hotelId } = get()

        if (!hotelId) {
            set({ loading: false, error: 'No hotel selected' })
            return () => { }
        }

        set({ loading: true, error: null })

        // Create query for logs ordered by creation time
        const logsRef = collection(db, 'hotels', hotelId, 'logs')
        const logsQuery = query(logsRef, orderBy('created_at', 'desc'))

        // Mock Logs for Live Demo
        if (hotelId === 'demo-hotel-id') {
            const mockLogs: Log[] = [
                {
                    id: 'log-1',
                    type: 'maintenance',
                    content: 'Air conditioning in Room 101 is leaking.',
                    room_number: '101',
                    urgency: 'critical',
                    status: 'open',
                    created_at: new Date(),
                    created_by: 'demo-user-staff',
                    created_by_name: 'Receptionist',
                    is_pinned: true
                },
                {
                    id: 'log-2',
                    type: 'guest_request',
                    content: 'Guest in 204 requested extra pillows.',
                    room_number: '204',
                    urgency: 'medium',
                    status: 'resolved',
                    created_at: new Date(Date.now() - 3600000),
                    created_by: 'demo-user-staff',
                    created_by_name: 'Receptionist',
                    is_pinned: false
                }
            ]

            set({
                logs: mockLogs,
                pinnedLogs: mockLogs.filter(l => l.is_pinned),
                loading: false,
                error: null
            })
            return () => { }
        }

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(
            logsQuery,
            (snapshot) => {
                const allLogs: Log[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        type: data.type as LogType,
                        content: data.content,
                        room_number: data.room_number || null,
                        urgency: data.urgency as LogUrgency,
                        status: data.status as LogStatus,
                        created_at: convertTimestamp(data.created_at),
                        created_by: data.created_by,
                        created_by_name: data.created_by_name || 'Staff',
                        is_pinned: data.is_pinned || false,
                    } as Log
                })

                // Separate pinned logs
                const pinnedLogs = allLogs.filter(log => log.is_pinned)

                set({
                    logs: allLogs,
                    pinnedLogs,
                    loading: false,
                    error: null
                })
            },
            (error) => {
                console.error('Error listening to logs:', error)
                set({
                    error: error.message,
                    loading: false
                })
            }
        )

        return unsubscribe
    },

    addLog: async (logData) => {
        const { hotelId } = get()
        if (!hotelId) return

        try {
            const logsRef = collection(db, 'hotels', hotelId, 'logs')
            await addDoc(logsRef, {
                ...logData,
                created_at: serverTimestamp()
            })
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    editLog: async (id, updates) => {
        const { hotelId } = get()
        if (!hotelId) return

        try {
            const logRef = doc(db, 'hotels', hotelId, 'logs', id)
            await updateDoc(logRef, updates)
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    updateLogStatus: async (logId: string, status: LogStatus) => {
        const { hotelId } = get()

        if (!hotelId) {
            throw new Error('No hotel selected')
        }

        try {
            const logRef = doc(db, 'hotels', hotelId, 'logs', logId)
            await updateDoc(logRef, { status })
        } catch (error) {
            console.error('Error updating log status:', error)
            throw error
        }
    },

    togglePin: async (logId, isPinned) => {
        const { hotelId } = get()
        if (!hotelId) return

        try {
            const logRef = doc(db, 'hotels', hotelId, 'logs', logId)
            await updateDoc(logRef, {
                is_pinned: isPinned
            })
        } catch (error) {
            console.error('Error toggling pin:', error)
            throw error
        }
    },

    archiveLog: async (logId) => {
        const { hotelId } = get()
        if (!hotelId) return

        try {
            const logRef = doc(db, 'hotels', hotelId, 'logs', logId)
            await updateDoc(logRef, {
                status: 'archived'
            })
        } catch (error) {
            console.error('Error archiving log:', error)
            throw error
        }
    }
}))
