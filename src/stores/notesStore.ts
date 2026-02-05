import { create } from 'zustand'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Note categories
export type NoteCategory =
    | 'handover'      // General handover notes
    | 'damage'        // Property damage (payment collection)
    | 'early_checkout'// Early checkout info
    | 'guest_info'    // Guest-specific notes
    | 'other'

export interface ShiftNote {
    id: string
    category: NoteCategory
    content: string
    room_number: string | null
    is_relevant: boolean
    amount_due: number | null  // For damage notes
    is_paid: boolean           // For damage notes
    created_at: Date
    created_by: string
    created_by_name: string
    shift_id: string | null
    resolved_at: Date | null
    resolved_by: string | null
}

interface NotesState {
    notes: ShiftNote[]
    loading: boolean
    error: string | null
}

interface NotesActions {
    subscribeToNotes: (hotelId: string) => () => void
    addNote: (hotelId: string, note: Omit<ShiftNote, 'id' | 'created_at' | 'resolved_at' | 'resolved_by'>) => Promise<void>
    toggleRelevance: (hotelId: string, noteId: string, isRelevant: boolean) => Promise<void>
    markPaid: (hotelId: string, noteId: string) => Promise<void>
    deleteNote: (hotelId: string, noteId: string) => Promise<void>
}

type NotesStore = NotesState & NotesActions

const convertTimestamp = (timestamp: Timestamp | Date | null): Date => {
    if (!timestamp) return new Date()
    if (timestamp instanceof Timestamp) return timestamp.toDate()
    return timestamp
}

export const useNotesStore = create<NotesStore>((set) => ({
    notes: [],
    loading: true,
    error: null,

    subscribeToNotes: (hotelId: string) => {
        set({ loading: true, error: null })

        const notesRef = collection(db, 'hotels', hotelId, 'shift_notes')
        const notesQuery = query(notesRef, orderBy('created_at', 'desc'))

        const unsubscribe = onSnapshot(
            notesQuery,
            (snapshot) => {
                const notesList: ShiftNote[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        category: data.category as NoteCategory,
                        content: data.content,
                        room_number: data.room_number || null,
                        is_relevant: data.is_relevant ?? true,
                        amount_due: data.amount_due || null,
                        is_paid: data.is_paid || false,
                        created_at: convertTimestamp(data.created_at),
                        created_by: data.created_by,
                        created_by_name: data.created_by_name || 'Unknown',
                        shift_id: data.shift_id || null,
                        resolved_at: data.resolved_at ? convertTimestamp(data.resolved_at) : null,
                        resolved_by: data.resolved_by || null,
                    }
                })

                set({ notes: notesList, loading: false, error: null })
            },
            (error) => {
                console.error('Error subscribing to notes:', error)
                set({ error: error.message, loading: false })
            }
        )

        return unsubscribe
    },

    addNote: async (hotelId, noteData) => {
        try {
            const notesRef = collection(db, 'hotels', hotelId, 'shift_notes')
            await addDoc(notesRef, {
                ...noteData,
                created_at: serverTimestamp(),
                resolved_at: null,
                resolved_by: null,
            })
        } catch (error) {
            console.error('Error adding note:', error)
            throw error
        }
    },

    toggleRelevance: async (hotelId, noteId, isRelevant) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            await updateDoc(noteRef, {
                is_relevant: isRelevant,
                resolved_at: isRelevant ? null : serverTimestamp(),
            })
        } catch (error) {
            console.error('Error toggling relevance:', error)
            throw error
        }
    },

    markPaid: async (hotelId, noteId) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            await updateDoc(noteRef, {
                is_paid: true,
                resolved_at: serverTimestamp(),
            })
        } catch (error) {
            console.error('Error marking paid:', error)
            throw error
        }
    },

    deleteNote: async (hotelId, noteId) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            await deleteDoc(noteRef)
        } catch (error) {
            console.error('Error deleting note:', error)
            throw error
        }
    },
}))

// Category display info
export const categoryInfo: Record<NoteCategory, { label: string; color: string; icon: string }> = {
    handover: { label: 'Handover', color: 'bg-indigo-500', icon: '📋' },
    damage: { label: 'Damage', color: 'bg-rose-500', icon: '⚠️' },
    early_checkout: { label: 'Early Checkout', color: 'bg-amber-500', icon: '🚪' },
    guest_info: { label: 'Guest Info', color: 'bg-emerald-500', icon: '👤' },
    other: { label: 'Other', color: 'bg-zinc-500', icon: '📝' },
}
