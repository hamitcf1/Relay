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

        // Parse time if available, otherwise use created_at
        let eventDate = note.created_at instanceof Timestamp ? note.created_at.toDate() : note.created_at

        if (note.time) {
            const [hours, minutes] = note.time.split(':').map(Number)
            eventDate.setHours(hours, minutes, 0, 0)
        }

        const staffAssignee = note.assigned_staff_name ? ` → ${note.assigned_staff_name}` : ''
        const guestInfo = note.guest_name ? ` [Guest: ${note.guest_name}]` : ''

        const eventData = {
            title: `[${note.category.toUpperCase()}] ${note.room_number ? `#${note.room_number}: ` : ''}${note.content.substring(0, 30)}...${staffAssignee}${guestInfo}`,
            description: `Guest: ${note.guest_name || 'N/A'}\nAssigned: ${note.assigned_staff_name || 'N/A'}\n\n${note.content}`,
            start_date: eventDate,
            end_date: eventDate, // Logic: For now, same as start (point in time)
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

/**
 * Syncs roster changes to calendar. Specifically handles 'OFF' days.
 */
export async function syncRosterToCalendar(
    hotelId: string,
    userId: string,
    userName: string,
    dateStr: string, // YYYY-MM-DD
    shift: string
) {
    try {
        const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')

        // We look for existing "Off Day" events for this user on this date
        // Note: Ideally we store some metadata on the event like "roster_sync: true" or "related_user: uid"
        // For now, we'll query by type 'off_day' and description containing the user name or some unique tag if possible.
        // Actually, let's verify if we can add a 'user_id' field to events schema? 
        // Based on previous code, we can just use the note_id field or add a new one. 
        // Let's rely on type='off_day' and check the start_date matching the roster date.

        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0) // Start of day

        // This query might be broad if multiple people are off, so we filter in memory if needed
        // or better, let's look for events created by system for this user
        // We will assume title contains "Off Day: [Name]"

        const q = query(
            eventsRef,
            where('type', '==', 'off_day'),
            where('start_date', '==', targetDate)
        )

        const snapshot = await getDocs(q)
        let existingEvent = snapshot.docs.find(d => d.data().description?.includes(`User ID: ${userId}`))

        if (shift === 'OFF') {
            if (!existingEvent) {
                // Create Off Day Event
                await addDoc(eventsRef, {
                    title: `Off Day: ${userName}`,
                    description: `Scheduled Off Day for ${userName}\nUser ID: ${userId}`,
                    start_date: targetDate,
                    end_date: targetDate,
                    all_day: true,
                    type: 'off_day',
                    status: 'confirmed',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                })
            } else {
                // Ensure it's confirmed
                if (existingEvent.data().status !== 'confirmed') {
                    await updateDoc(doc(db, 'hotels', hotelId, 'calendar_events', existingEvent.id), {
                        status: 'confirmed',
                        updated_at: serverTimestamp()
                    })
                }
            }
        } else {
            // If shift is NOT OFF, ensure no Off Day event exists
            if (existingEvent) {
                await updateDoc(doc(db, 'hotels', hotelId, 'calendar_events', existingEvent.id), {
                    status: 'cancelled',
                    updated_at: serverTimestamp()
                })
            }
        }
    } catch (error) {
        console.error('Error syncing roster to calendar:', error)
    }
}
