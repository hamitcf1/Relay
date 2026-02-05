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
import type { ShiftNote, NoteCategory, NoteStatus } from '@/types'
import { syncNoteToCalendar, removeNoteFromCalendar } from '@/lib/calendar-sync'

export type { NoteCategory, NoteStatus }

interface NotesState {
    notes: ShiftNote[]
    loading: boolean
    error: string | null
}

interface NotesActions {
    subscribeToNotes: (hotelId: string) => () => void
    addNote: (hotelId: string, note: Omit<ShiftNote, 'id' | 'created_at' | 'resolved_at' | 'resolved_by' | 'status'>) => Promise<void>
    updateNote: (hotelId: string, noteId: string, updates: Partial<ShiftNote>) => Promise<void>
    updateNoteStatus: (hotelId: string, noteId: string, status: NoteStatus, resolvedBy?: string) => Promise<void>
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
                        status: data.status || (data.resolved_at ? 'resolved' : 'active'),
                        amount_due: data.amount_due || null,
                        is_paid: data.is_paid || false,
                        created_at: convertTimestamp(data.created_at),
                        created_by: data.created_by,
                        created_by_name: data.created_by_name || 'Unknown',
                        shift_id: data.shift_id || null,
                        resolved_at: data.resolved_at ? convertTimestamp(data.resolved_at) : null,
                        resolved_by: data.resolved_by || null,
                        is_anonymous: data.is_anonymous || false
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
            const docRef = await addDoc(notesRef, {
                ...noteData,
                status: 'active',
                created_at: serverTimestamp(),
                resolved_at: null,
                resolved_by: null,
            })

            // Sync to calendar if relevant
            if (noteData.is_relevant) {
                const newNote: ShiftNote = {
                    id: docRef.id,
                    ...noteData,
                    status: 'active',
                    created_at: new Date(),
                    resolved_at: null,
                    resolved_by: null,
                }
                await syncNoteToCalendar(hotelId, newNote)
            }
        } catch (error) {
            console.error('Error adding note:', error)
            throw error
        }
    },

    updateNote: async (hotelId, noteId, updates) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)

            // Optimize: if status is changing to resolved, handle metadata
            if (updates.status === 'resolved' || updates.status === 'archived') {
                updates.resolved_at = updates.resolved_at || new Date()
            }

            // Clean undefined
            const cleanUpdates = Object.entries(updates).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v
                return acc
            }, {} as any)

            await updateDoc(noteRef, cleanUpdates)

            // Re-sync with calendar
            const note = useNotesStore.getState().notes.find(n => n.id === noteId)
            if (note && (note.is_relevant || updates.is_relevant)) {
                // Merge current note with updates for sync
                await syncNoteToCalendar(hotelId, { ...note, ...updates } as ShiftNote)
            }
        } catch (error) {
            console.error('Error updating note:', error)
            throw error
        }
    },

    updateNoteStatus: async (hotelId, noteId, status, resolvedBy) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const updates: any = { status }
            if (status === 'resolved' || status === 'archived') {
                updates.resolved_at = serverTimestamp()
                if (resolvedBy) updates.resolved_by = resolvedBy
                await removeNoteFromCalendar(hotelId, noteId)
            } else if (status === 'active') {
                updates.resolved_at = null
                updates.resolved_by = null

                const note = useNotesStore.getState().notes.find(n => n.id === noteId)
                if (note && note.is_relevant) {
                    await syncNoteToCalendar(hotelId, { ...note, status: 'active' })
                }
            }
            await updateDoc(noteRef, updates)
        } catch (error) {
            console.error('Error updating note status:', error)
            throw error
        }
    },

    toggleRelevance: async (hotelId, noteId, isRelevant) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const status = isRelevant ? 'active' : 'resolved'
            await updateDoc(noteRef, {
                is_relevant: isRelevant,
                status,
                resolved_at: isRelevant ? null : serverTimestamp(),
            })

            if (isRelevant) {
                const note = useNotesStore.getState().notes.find(n => n.id === noteId)
                if (note) await syncNoteToCalendar(hotelId, { ...note, is_relevant: true, status: 'active' })
            } else {
                await removeNoteFromCalendar(hotelId, noteId)
            }
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
                status: 'resolved',
                resolved_at: serverTimestamp(),
            })
            await removeNoteFromCalendar(hotelId, noteId)
        } catch (error) {
            console.error('Error marking paid:', error)
            throw error
        }
    },

    deleteNote: async (hotelId, noteId) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            await deleteDoc(noteRef)
            await removeNoteFromCalendar(hotelId, noteId)
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
    feedback: { label: 'Feedback', color: 'bg-purple-500', icon: '💬' },
    other: { label: 'Other', color: 'bg-zinc-500', icon: '📝' },
}
