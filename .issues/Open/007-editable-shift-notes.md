# Issue: Make Shift Notes (Issues & Tickets) Editable

## Description
Currently, issues and tickets created under the Shift Notes section are static. They should be enhanced to allow in-place editing of their content (text) and their category/type.

## Requirements
- Add an "Edit" capability to notes in the `ShiftNotes.tsx` component.
- Allow users to modify the `content` of an existing note.
- Allow users to change the `category` of a note (e.g., from 'handover' to 'damage').
- Ensure changes are persisted to Firestore via the `notesStore.ts`.
- Maintain the Cyber-Concierge aesthetic (fluid animations, glassmorphism) during the transition to edit mode.

## Related Files
- `src/components/notes/ShiftNotes.tsx`
- `src/stores/notesStore.ts`
- `src/types/index.ts`
