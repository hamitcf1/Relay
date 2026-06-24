import { create } from 'zustand'
import { toast } from 'sonner'
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
    Timestamp,
    arrayUnion,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ShiftNote, NoteCategory, NoteStatus, NotePriority } from '@/types'
import { syncNoteToCalendar, removeNoteFromCalendar } from '@/lib/calendar-sync'
import { useAuthStore } from './authStore'
import { useActivityStore } from './activityStore'

export type { NoteCategory, NoteStatus, NotePriority }

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
    convertToLog: (hotelId: string, noteId: string) => Promise<void>
    togglePin: (hotelId: string, noteId: string, isPinned: boolean) => Promise<void>
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

        // Mock Notes for Live Demo
        if (hotelId === 'demo-hotel-id') {
            const mockNotes: ShiftNote[] = [
                {
                    id: 'note-1',
                    category: 'handover',
                    content: 'VIP guest in Room 204 requires 6:00 AM wake-up call.',
                    room_number: '204',
                    is_relevant: true,
                    status: 'active',
                    amount_due: null,
                    is_paid: false,
                    created_at: new Date(),
                    created_by: 'demo-user-gm',
                    created_by_name: 'Manager',
                    shift_id: 'DEMO_SHIFT_A',
                    resolved_at: null,
                    resolved_by: null,
                    is_anonymous: false
                },
                {
                    id: 'note-2',
                    category: 'minibar',
                    content: 'Room 101 consumed 2 Cokes and 1 Water.',
                    room_number: '101',
                    is_relevant: true,
                    status: 'active',
                    amount_due: 150,
                    is_paid: false,
                    created_at: new Date(Date.now() - 7200000),
                    created_by: 'demo-user-staff',
                    created_by_name: 'Receptionist',
                    shift_id: 'DEMO_SHIFT_A',
                    resolved_at: null,
                    resolved_by: null,
                    is_anonymous: false
                }
            ]

            set({ notes: mockNotes, loading: false, error: null })
            return () => { }
        }

        const unsubscribe = onSnapshot(
            notesQuery,
            (snapshot) => {
                const notesList: ShiftNote[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        category: data.category as NoteCategory,
                        priority: data.priority || 'low',
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
                        is_anonymous: data.is_anonymous || false,
                        updated_at: data.updated_at ? convertTimestamp(data.updated_at) : undefined,
                        currency: data.currency || undefined,
                        time: data.time || null,
                        guest_name: data.guest_name || null,
                        assigned_staff_uid: data.assigned_staff_uid || null,
                        assigned_staff_name: data.assigned_staff_name || null,
                        is_pinned: data.is_pinned || false,
                        edit_history: Array.isArray(data.edit_history)
                            ? data.edit_history.map((e: any) => ({
                                edited_at: convertTimestamp(e.edited_at),
                                edited_by: e.edited_by || 'system',
                                edited_by_name: e.edited_by_name || 'Unknown',
                                changes: e.changes || {},
                            : undefined,
                        sale_id: data.sale_id || undefined
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

            // Clean undefined
            const cleanData = Object.entries(noteData).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v
                return acc
            }, {} as any)

            const docRef = await addDoc(notesRef, {
                ...cleanData,
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

            // Log activity
            const user = useAuthStore.getState().user
            if (user) {
                useActivityStore.getState().logActivity(
                    hotelId, user.uid, user.name, user.role,
                    'note_create', noteData.content?.substring(0, 60) || 'New note'
                )
            }

            toast.success('Note added')
        } catch (error) {
            console.error('Error adding note:', error)
            toast.error('Failed to add note')
            throw error
        }
    },

    updateNote: async (hotelId, noteId, updates) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const currentNote = useNotesStore.getState().notes.find(n => n.id === noteId)

            // Optimize: if status is changing to resolved, handle metadata
            if (updates.status === 'resolved' || updates.status === 'archived') {
                updates.resolved_at = updates.resolved_at || new Date()
            }

            updates.updated_at = serverTimestamp() as any

            // Build a diff entry for fields users can edit on the card. We log the
            // PREVIOUS value so GMs can see what got rewritten. Compare with === —
            // null/empty-string distinctions are intentional (room_number is null
            // vs empty string, etc).
            const TRACKED_FIELDS: (keyof ShiftNote)[] = [
                'content',
                'category',
                'priority',
                'room_number',
                'amount_due',
                'time',
                'guest_name',
                'assigned_staff_uid',
                'assigned_staff_name',
            ]
            const changes: Record<string, { before: unknown; after: unknown }> = {}
            if (currentNote) {
                for (const field of TRACKED_FIELDS) {
                    if (!(field in updates)) continue
                    const before = currentNote[field] ?? null
                    const after = (updates as any)[field] ?? null
                    if (before !== after) {
                        changes[field] = { before, after }
                    }
                }
            }

            // Clean undefined
            const cleanUpdates = Object.entries(updates).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v
                return acc
            }, {} as any)

            // Only append a history entry when we actually have a tracked change.
            // Pure status/pin/paid flips don't touch updateNote, so they won't be logged here.
            if (Object.keys(changes).length > 0) {
                const user = useAuthStore.getState().user
                const entry = {
                    edited_at: Timestamp.now(),
                    edited_by: user?.uid || 'system',
                    edited_by_name: user?.name || 'System',
                    changes,
                }
                cleanUpdates.edit_history = arrayUnion(entry)
            }

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
            toast.success('Marked as paid ✓')
        } catch (error) {
            console.error('Error marking paid:', error)
            toast.error('Failed to mark as paid')
            throw error
        }
    },

    deleteNote: async (hotelId, noteId) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            await deleteDoc(noteRef)
            await removeNoteFromCalendar(hotelId, noteId)

            // Log activity
            const user = useAuthStore.getState().user
            const note = useNotesStore.getState().notes.find(n => n.id === noteId)
            if (user) {
                useActivityStore.getState().logActivity(
                    hotelId, user.uid, user.name, user.role,
                    'note_delete', 
                    note ? `Deleted: "${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}" (Room ${note.room_number || 'N/A'})` : `Note ID: ${noteId}`
                )
            }
            toast.success('Note deleted')
        } catch (error) {
            console.error('Error deleting note:', error)
            toast.error('Failed to delete note')
            throw error
        }
    },

    convertToLog: async (hotelId, noteId) => {
        try {
            const note = useNotesStore.getState().notes.find(n => n.id === noteId)
            if (!note) throw new Error("Note not found")

            const logsRef = collection(db, 'hotels', hotelId, 'logs')
            await addDoc(logsRef, {
                type: 'system', // or based on category
                content: `[Promoted from Note] ${note.content}`,
                room_number: note.room_number,
                urgency: 'low',
                status: 'open',
                created_at: serverTimestamp(),
                created_by: note.created_by === 'anonymous' ? 'system' : note.created_by,
                created_by_name: note.created_by_name,
                is_pinned: false,
                guest_name: note.guest_name || undefined
            })

            // Optionally mark note as resolved/archived?
            // "Add 'Convert to Log' button/feature for notes"
            // Usually this implies the note is "processed" into a log.
            // Let's mark it resolved to avoid duplication.
            await useNotesStore.getState().updateNoteStatus(hotelId, noteId, 'resolved', 'system')

        } catch (error) {
            console.error('Error converting note to log:', error)
            throw error
        }
    },

    togglePin: async (hotelId, noteId, isPinned) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            await updateDoc(noteRef, {
                is_pinned: isPinned,
                updated_at: serverTimestamp()
            })
            toast.success(isPinned ? 'Note pinned to Sticky Board' : 'Note unpinned')
        } catch (error) {
            console.error('Error toggling pin:', error)
            toast.error('Failed to update pin status')
        }
    }
}))

// Category display info
export const categoryInfo: Record<NoteCategory, { label: string; color: string; icon: string }> = {
    handover: { label: 'Handover', color: 'bg-indigo-500', icon: '📋' },
    damage: { label: 'Damage', color: 'bg-rose-500', icon: '⚠️' },
    upgrade: { label: 'Upgrade', color: 'bg-emerald-600', icon: '⬆️' },
    payment_needed: { label: 'Payment Needed', color: 'bg-green-500', icon: '💳' },
    restaurant: { label: 'Restaurant', color: 'bg-orange-500', icon: '🍽️' },
    minibar: { label: 'Minibar', color: 'bg-zinc-700', icon: '🥤' },
    early_checkout: { label: 'Early Checkout', color: 'bg-amber-500', icon: '🚪' },
    guest_info: { label: 'Guest Info', color: 'bg-cyan-500', icon: '👤' },
    feedback: { label: 'Feedback', color: 'bg-purple-500', icon: '💬' },
    other: { label: 'Other', color: 'bg-zinc-500', icon: '📝' },
}

// Priority display info — minimal dot indicator
export const priorityInfo: Record<NotePriority, {
    symbol: string
    color: string
    textClass: string
    glowClass: string
}> = {
    low: { symbol: '', color: 'text-muted-foreground', textClass: '', glowClass: '' },
    medium: { symbol: '', color: 'text-amber-500', textClass: '', glowClass: '' },
    high: { symbol: '', color: 'text-orange-500', textClass: '', glowClass: '' },
    critical: { symbol: '', color: 'text-rose-500', textClass: '', glowClass: '' },
}
