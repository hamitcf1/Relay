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
    writeBatch,
    limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ShiftNote, NoteCategory, NoteStatus, NotePriority } from '@/types'
import { syncNoteToCalendar, removeNoteFromCalendar } from '@/lib/calendar-sync'
import { useAuthStore } from './authStore'
import { useActivityStore } from './activityStore'
import { useSalesStore } from './salesStore'

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
    bulkUpdateNoteStatus: (hotelId: string, noteIds: string[], status: NoteStatus, resolvedBy?: string) => Promise<void>
    bulkDeleteNotes: (hotelId: string, noteIds: string[]) => Promise<void>
    emptyTrash: (hotelId: string) => Promise<void>
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
        const notesQuery = query(notesRef, orderBy('created_at', 'desc'), limit(200))

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
                    is_anonymous: false,
                    priority: 'critical',
                    is_pinned: true,
                    assigned_staff_name: 'Night team',
                    updated_at: new Date(Date.now() - 1800000)
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
                    is_anonymous: false,
                    priority: 'high',
                    assigned_staff_name: 'Receptionist',
                    updated_at: new Date(Date.now() - 7200000)
                },
                // Three maintenance tickets, deliberately in the order that proves the queue sorts
                // rather than just listing: one overdue and unassigned, one due today and assigned,
                // one closed with the work written down. A queue shown with a single empty-shaped
                // ticket teaches nothing about how it behaves when it matters.
                {
                    id: 'note-maint-1',
                    category: 'maintenance',
                    content: 'The lift in the east wing stops between floors 2 and 3.',
                    room_number: null,
                    is_relevant: false,
                    status: 'active',
                    amount_due: null,
                    is_paid: false,
                    created_at: new Date(Date.now() - 172800000),
                    created_by: 'demo-user-staff',
                    created_by_name: 'Receptionist',
                    shift_id: 'DEMO_SHIFT_A',
                    resolved_at: null,
                    resolved_by: null,
                    is_anonymous: false,
                    priority: 'critical',
                    due_at: new Date(Date.now() - 86400000),
                    updated_at: new Date(Date.now() - 172800000)
                },
                {
                    id: 'note-maint-2',
                    category: 'maintenance',
                    content: 'Room 204 air conditioning runs but does not cool.',
                    room_number: '204',
                    is_relevant: false,
                    status: 'active',
                    amount_due: null,
                    is_paid: false,
                    created_at: new Date(Date.now() - 3600000),
                    created_by: 'demo-user-gm',
                    created_by_name: 'Manager',
                    shift_id: 'DEMO_SHIFT_A',
                    resolved_at: null,
                    resolved_by: null,
                    is_anonymous: false,
                    priority: 'medium',
                    due_at: new Date(Date.now() + 86400000),
                    updated_at: new Date(Date.now() - 3600000)
                },
                {
                    id: 'note-maint-3',
                    category: 'maintenance',
                    content: 'The hot water takes over ten minutes to arrive.',
                    room_number: '310',
                    is_relevant: false,
                    status: 'resolved',
                    amount_due: null,
                    is_paid: false,
                    created_at: new Date(Date.now() - 259200000),
                    created_by: 'demo-user-staff',
                    created_by_name: 'Receptionist',
                    shift_id: 'DEMO_SHIFT_A',
                    resolved_at: new Date(Date.now() - 43200000),
                    resolved_by: 'demo-user-gm',
                    is_anonymous: false,
                    priority: 'high',
                    resolution: 'The mixing valve on the third floor was replaced.',
                    updated_at: new Date(Date.now() - 43200000)
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
                        status: (data.status as NoteStatus) || (data.resolved_at ? 'resolved' : 'active'),
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
                        trashed_at: data.trashed_at ? convertTimestamp(data.trashed_at) : undefined,
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
                            }))
                            : undefined,
                        sale_id: data.sale_id || undefined
                    }
                })

                // Auto Purge Trash older than 30 days
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                const expiredTrash = notesList.filter(n => n.status === 'trash' && ((n.trashed_at || n.updated_at || n.created_at) < thirtyDaysAgo))
                if (expiredTrash.length > 0) {
                    expiredTrash.forEach(async (n) => {
                        try {
                            await deleteDoc(doc(db, 'hotels', hotelId, 'shift_notes', n.id))
                        } catch (e) {
                            console.error('Trash auto purge error:', e)
                        }
                    })
                }

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
        if (hotelId === 'demo-hotel-id') {
            const note: ShiftNote = {
                id: `demo-note-${Date.now()}`,
                ...noteData,
                status: 'active',
                created_at: new Date(),
                resolved_at: null,
                resolved_by: null,
            }
            set((state) => ({ notes: [note, ...state.notes] }))
            toast.success('Note added')
            return
        }
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

            // Firestore gets a server sentinel; the demo store holds real Dates
            updates.updated_at = (hotelId === 'demo-hotel-id' ? new Date() : serverTimestamp()) as any

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
                    edited_at: new Date(),
                    edited_by: user?.uid || 'system',
                    edited_by_name: user?.name || 'System',
                    changes,
                }
                if (hotelId === 'demo-hotel-id') {
                    cleanUpdates.edit_history = [...(currentNote?.edit_history ?? []), entry]
                } else {
                    // arrayUnion appends server-side, so concurrent editors can't clobber each other
                    cleanUpdates.edit_history = arrayUnion(entry)
                }
            }

            if (hotelId === 'demo-hotel-id') {
                set((state) => ({
                    notes: state.notes.map(n => n.id === noteId ? { ...n, ...cleanUpdates } : n)
                }))
            } else {
                await updateDoc(noteRef, cleanUpdates)
            }

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
            const isDemo = hotelId === 'demo-hotel-id'
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const updates: any = { status }
            if (status === 'resolved' || status === 'archived') {
                updates.resolved_at = isDemo ? new Date() : serverTimestamp()
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
            if (isDemo) {
                set((state) => ({
                    notes: state.notes.map(n => n.id === noteId ? { ...n, ...updates } : n)
                }))
            } else {
                await updateDoc(noteRef, updates)
            }
        } catch (error) {
            console.error('Error updating note status:', error)
            throw error
        }
    },

    toggleRelevance: async (hotelId, noteId, isRelevant) => {
        try {
            const isDemo = hotelId === 'demo-hotel-id'
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const status: NoteStatus = isRelevant ? 'active' : 'resolved'
            const localPatch: Partial<ShiftNote> = {
                is_relevant: isRelevant,
                status,
                resolved_at: isRelevant ? null : new Date(),
            }

            if (isDemo) {
                set((state) => ({
                    notes: state.notes.map(n => n.id === noteId ? { ...n, ...localPatch } : n)
                }))
            } else {
                await updateDoc(noteRef, {
                    ...localPatch,
                    resolved_at: isRelevant ? null : serverTimestamp(),
                })
            }

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
            const isDemo = hotelId === 'demo-hotel-id'
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const note = useNotesStore.getState().notes.find(n => n.id === noteId)

            // If note is linked to a sale, sync with salesStore
            if (note?.sale_id) {
                const sales = useSalesStore.getState().sales
                const sale = sales.find(s => s.id === note.sale_id)
                if (sale) {
                    const remaining = Math.max(0, sale.total_price - sale.collected_amount)
                    if (remaining > 0) {
                        await useSalesStore.getState().collectPayment(
                            hotelId,
                            note.sale_id,
                            remaining,
                            sale.currency
                        )
                    }
                }
            }

            const localPatch: Partial<ShiftNote> = {
                is_paid: true,
                amount_due: 0,
            }
            if (isDemo) {
                set((state) => ({
                    notes: state.notes.map(n => n.id === noteId ? { ...n, ...localPatch } : n)
                }))
            } else {
                await updateDoc(noteRef, localPatch)
            }
            toast.success('Ödeme alındı olarak işaretlendi ✓')
        } catch (error) {
            console.error('Error marking paid:', error)
            toast.error('Failed to mark as paid')
            throw error
        }
    },

    deleteNote: async (hotelId, noteId) => {
        try {
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            if (hotelId === 'demo-hotel-id') {
                set((state) => ({ notes: state.notes.filter(n => n.id !== noteId) }))
            } else {
                await deleteDoc(noteRef)
            }
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

            // The demo has no logs surface to write into, so only the note state changes
            if (hotelId !== 'demo-hotel-id') {
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
            }

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
            const isDemo = hotelId === 'demo-hotel-id'
            const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', noteId)
            const localPatch: Partial<ShiftNote> = { is_pinned: isPinned, updated_at: new Date() }
            if (isDemo) {
                set((state) => ({
                    notes: state.notes.map(n => n.id === noteId ? { ...n, ...localPatch } : n)
                }))
            } else {
                await updateDoc(noteRef, { ...localPatch, updated_at: serverTimestamp() })
            }
            toast.success(isPinned ? 'Note pinned to Sticky Board' : 'Note unpinned')
        } catch (error) {
            console.error('Error toggling pin:', error)
            toast.error('Failed to update pin status')
        }
    },

    bulkUpdateNoteStatus: async (hotelId: string, noteIds: string[], status: NoteStatus, resolvedBy?: string) => {
        if (noteIds.length === 0) return
        try {
            const isDemo = hotelId === 'demo-hotel-id'
            const updates: any = { status, updated_at: isDemo ? new Date() : serverTimestamp() }
            if (status === 'resolved' || status === 'archived') {
                updates.resolved_at = isDemo ? new Date() : serverTimestamp()
                if (resolvedBy) updates.resolved_by = resolvedBy
            } else if (status === 'trash') {
                updates.trashed_at = isDemo ? new Date() : serverTimestamp()
            } else if (status === 'active') {
                updates.resolved_at = null
                updates.resolved_by = null
                updates.trashed_at = null
            }

            if (isDemo) {
                set((state) => ({
                    notes: state.notes.map(n => noteIds.includes(n.id) ? { ...n, ...updates } : n)
                }))
            } else {
                const batch = writeBatch(db)
                noteIds.forEach(id => {
                    const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', id)
                    batch.update(noteRef, updates)
                })
                await batch.commit()
            }
            toast.success(`${noteIds.length} not güncellendi`)
        } catch (error) {
            console.error('Error bulk updating notes:', error)
            toast.error('Toplu güncelleme başarısız oldu')
        }
    },

    bulkDeleteNotes: async (hotelId: string, noteIds: string[]) => {
        if (noteIds.length === 0) return
        try {
            const isDemo = hotelId === 'demo-hotel-id'
            if (isDemo) {
                set((state) => ({ notes: state.notes.filter(n => !noteIds.includes(n.id)) }))
            } else {
                const batch = writeBatch(db)
                noteIds.forEach(id => {
                    const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', id)
                    batch.delete(noteRef)
                })
                await batch.commit()
            }
            toast.success(`${noteIds.length} not kalıcı olarak silindi`)
        } catch (error) {
            console.error('Error bulk deleting notes:', error)
            toast.error('Toplu silme başarısız oldu')
        }
    },

    emptyTrash: async (hotelId: string) => {
        try {
            const { notes } = useNotesStore.getState()
            const trashNoteIds = notes.filter(n => n.status === 'trash').map(n => n.id)
            if (trashNoteIds.length === 0) {
                toast.info('Çöp kutusu zaten boş')
                return
            }

            const isDemo = hotelId === 'demo-hotel-id'
            if (isDemo) {
                set((state) => ({ notes: state.notes.filter(n => n.status !== 'trash') }))
            } else {
                const batch = writeBatch(db)
                trashNoteIds.forEach(id => {
                    const noteRef = doc(db, 'hotels', hotelId, 'shift_notes', id)
                    batch.delete(noteRef)
                })
                await batch.commit()
            }
            toast.success('Çöp kutusu temizlendi')
        } catch (error) {
            console.error('Error emptying trash:', error)
            toast.error('Çöp kutusu temizlenemedi')
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
    maintenance: { label: 'Maintenance', color: 'bg-amber-500', icon: '🔧' },
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
