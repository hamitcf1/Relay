# Issue: Link Shift Notes to Calendar with Enhanced Properties

## Description
Shift notes (issues/tickets) should be more deeply integrated with the calendar. Currently, sync is basic. Users should be able to specify a specific time, associated guest (person), and staff member when creating or editing a note, and these properties should sync to the corresponding calendar event.

## Requirements
- **Time Property**: Add a `time` field to `ShiftNote` (e.g., HH:MM) to allow scheduling specific actions.
- **Staff Property**: Explicitly link a note to a staff member (assigned staff) in addition to the creator.
- **Guest Property**: Add an optional `guest_name` field to link the note to a specific guest.
- **Calendar Sync Enhancement**: Update `syncNoteToCalendar` in `calendar-sync.ts` to:
    - Use the specified `time` for the calendar event instead of just `created_at`.
    - Include `guest_name` and `assigned_staff_name` in the event description or title.
    - Map `ShiftNote` categories more accurately to `CalendarEventType`.
- **UI Update**: Update `ShiftNotes.tsx` creation form and edit mode to include inputs for Time, Guest Name, and Assigned Staff.

## Related Files
- `src/types/index.ts`
- `src/components/notes/ShiftNotes.tsx`
- `src/lib/calendar-sync.ts`
- `src/stores/notesStore.ts`
