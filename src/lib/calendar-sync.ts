import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCalendarStore, type CalendarEventType } from '@/stores/calendarStore'
import type { ShiftNote } from '@/types'

/**
 * Syncs a shift note to the calendar if it's relevant and not resolved.
 * This can be expanded to create/update calendar events based on note content.
 */
export async function syncNoteToCalendar(hotelId: string, note: ShiftNote) {
    if (!note.is_relevant || note.status !== 'active') return

    // Parse time if available, otherwise use created_at
    const eventDate = note.created_at instanceof Timestamp ? note.created_at.toDate() : new Date(note.created_at)
    if (note.time) {
        const [hours, minutes] = note.time.split(':').map(Number)
        eventDate.setHours(hours, minutes, 0, 0)
    }

    const staffAssignee = note.assigned_staff_name ? ` → ${note.assigned_staff_name}` : ''
    const guestInfo = note.guest_name ? ` [Guest: ${note.guest_name}]` : ''

    const title = `[${note.category.toUpperCase()}] ${note.room_number ? `#${note.room_number}: ` : ''}${note.content.substring(0, 30)}...${staffAssignee}${guestInfo}`
    const description = `Guest: ${note.guest_name || 'N/A'}\nAssigned: ${note.assigned_staff_name || 'N/A'}\n\n${note.content}`
    const type = (note.category === 'damage' ? 'financial' : 'reminder') as CalendarEventType

    // The live demo has no Firebase session, so mirror the write into the store
    // instead. Deterministic ids keep the create/update branch working.
    if (hotelId === 'demo-hotel-id') {
        const demoId = `demo-note-event-${note.id}`
        const { events, addEvent, updateEvent } = useCalendarStore.getState()
        if (events.some(e => e.id === demoId)) {
            await updateEvent(hotelId, demoId, { title, description, date: eventDate })
        } else {
            await addEvent(hotelId, {
                type,
                title,
                description,
                date: eventDate,
                time: note.time ?? null,
                room_number: note.room_number ?? null,
                total_price: null,
                collected_amount: null,
                created_by: note.created_by,
                created_by_name: note.created_by_name,
            }, demoId)
        }
        return
    }

    try {
        const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')

        // Check if event already exists for this note
        const q = query(eventsRef, where('note_id', '==', note.id))
        const querySnapshot = await getDocs(q)

        const eventData = {
            title,
            description,
            start_date: eventDate,
            end_date: eventDate, // Logic: For now, same as start (point in time)
            all_day: true,
            type,
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
    if (hotelId === 'demo-hotel-id') {
        await useCalendarStore.getState().deleteEvent(hotelId, `demo-note-event-${noteId}`)
        return
    }

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
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0) // Start of day

    // Live demo: mirror into the store with a deterministic id per user+date
    if (hotelId === 'demo-hotel-id') {
        const demoId = `demo-offday-${userId}-${dateStr}`
        const { events, addEvent, deleteEvent } = useCalendarStore.getState()
        const existing = events.some(e => e.id === demoId)
        if (shift === 'OFF' && !existing) {
            await addEvent(hotelId, {
                type: 'off_day',
                title: `Off Day: ${userName}`,
                description: `Scheduled Off Day for ${userName}\nUser ID: ${userId}`,
                date: targetDate,
                time: null,
                room_number: null,
                total_price: null,
                collected_amount: null,
                created_by: 'system',
                created_by_name: 'System',
            }, demoId)
        } else if (shift !== 'OFF' && existing) {
            await deleteEvent(hotelId, demoId)
        }
        return
    }

    try {
        const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')

        // We look for existing "Off Day" events for this user on this date
        // Note: Ideally we store some metadata on the event like "roster_sync: true" or "related_user: uid"
        // For now, we'll query by type 'off_day' and description containing the user name or some unique tag if possible.
        // Actually, let's verify if we can add a 'user_id' field to events schema? 
        // Based on previous code, we can just use the note_id field or add a new one. 
        // Let's rely on type='off_day' and check the start_date matching the roster date.

        // This query might be broad if multiple people are off, so we filter in memory if needed
        // or better, let's look for events created by system for this user
        // We will assume title contains "Off Day: [Name]"

        const q = query(
            eventsRef,
            where('type', '==', 'off_day'),
            where('date', '==', targetDate)
        )

        const snapshot = await getDocs(q)
        const existingEvent = snapshot.docs.find(d => d.data().description?.includes(`User ID: ${userId}`))

        if (shift === 'OFF') {
            if (!existingEvent) {
                // Create Off Day Event
                await addDoc(eventsRef, {
                    title: `Off Day: ${userName}`,
                    description: `Scheduled Off Day for ${userName}\nUser ID: ${userId}`,
                    date: targetDate,
                    type: 'off_day',
                    status: 'confirmed',
                    created_by: 'system',
                    created_by_name: 'System',
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
