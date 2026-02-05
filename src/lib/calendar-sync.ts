import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ShiftNote } from '@/types'

/**
 * Syncs a shift note to the calendar if it's relevant and not resolved.
 * This can be expanded to create/update calendar events based on note content.
 */
export async function syncNoteToCalendar(hotelId: string, note: ShiftNote) {
    if (!note.is_relevant || note.status !== 'active') return

    try {
        const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')

        // Check if event already exists for this note
        const q = query(eventsRef, where('note_id', '==', note.id))
        const querySnapshot = await getDocs(q)

        const eventData = {
            title: `[${note.category.toUpperCase()}] ${note.room_number ? `#${note.room_number}: ` : ''}${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}`,
            description: note.content,
            start_date: note.created_at instanceof Timestamp ? note.created_at.toDate() : note.created_at,
            end_date: note.created_at instanceof Timestamp ? note.created_at.toDate() : note.created_at,
            all_day: true,
            type: note.category === 'damage' ? 'financial' : 'reminder',
            status: 'confirmed',
            note_id: note.id,
            updated_at: serverTimestamp(),
        }

        if (querySnapshot.empty) {
            // Create new event
            await addDoc(eventsRef, {
                ...eventData,
                created_at: serverTimestamp(),
            })
        } else {
            // Update existing event
            const eventDoc = querySnapshot.docs[0]
            await updateDoc(doc(db, 'hotels', hotelId, 'calendar_events', eventDoc.id), eventData)
        }
    } catch (error) {
        console.error('Error syncing note to calendar:', error)
    }
}

/**
 * Removes a calendar event associated with a note.
 */
export async function removeNoteFromCalendar(hotelId: string, noteId: string) {
    try {
        const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')
        const q = query(eventsRef, where('note_id', '==', noteId))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            const eventDoc = querySnapshot.docs[0]
            await updateDoc(doc(db, 'hotels', hotelId, 'calendar_events', eventDoc.id), {
                status: 'cancelled',
                updated_at: serverTimestamp(),
            })
        }
    } catch (error) {
        console.error('Error removing note from calendar:', error)
    }
}
