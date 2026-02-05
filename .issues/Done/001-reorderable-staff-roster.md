# ISSUE-001: Persistent Reorderable Staff Roster

## Description
The General Manager (GM) needs the ability to reorder staff members in the Weekly Roster to prioritize certain team members or group them logically. This order must be permanent and persist across sessions until manually changed again.

## Proposed Changes

### 1. Data Model (Types)
- Update `HotelSettings` in `src/types/index.ts` to include `staff_order: string[]` (an array of user UIDs).

### 2. Store Updates (`hotelStore.ts`)
- Add an action `updateStaffOrder(hotelId: string, order: string[])` to update the `staff_order` in Firestore.

### 3. UI Enhancements (`RosterMatrix.tsx`)
- Implement `framer-motion`'s `Reorder` components for the table rows.
- Add a drag handle (using `lucide-react`'s `GripVertical`) visible only to GMs.
- Ensure the reordering logic triggers the `updateStaffOrder` action.
- Modify the staff fetching/loading logic to sort the `staff` array based on `hotel.settings.staff_order`.
- Handle new staff members by appending them to the end of the list if they aren't in the saved order.

### 4. Persistence
- The order should be saved to `hotels/{hotelId}` document under `settings.staff_order`.

## Success Criteria
- [x] GMs can drag and drop staff rows in the Roster Matrix.
- [x] Non-GM users cannot reorder staff.
- [x] The new order is saved to Firestore.
- [x] Refreshing the page maintains the staff order.
- [x] New staff members are automatically added to the bottom of the list.
