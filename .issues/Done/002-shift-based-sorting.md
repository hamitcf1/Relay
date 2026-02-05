# ISSUE-002: Shift-Based Sorting for Staff Roster

## Description
The staff roster (as seen in the Calendar Widget and other day-specific views) should be sorted by the shift type for that specific day. The current random or default order makes it difficult to quickly see who is on duty in chronological/priority order.

## Required Sorting Order
1.  **A** (Morning)
2.  **E** (Extra)
3.  **B** (Afternoon)
4.  **C** (Night)
5.  **OFF** (or not shown)

## Example
**Current:**
- Sude Naz Karadağ (B)
- Said Duyan (C)
- Hamit Can Fındık (E)
- Sema Döner (A)

**Desired:**
1. Sema Döner (A)
2. Hamit Can Fındık (E)
3. Sude Naz Karadağ (B)
4. Said Duyan (C)

## Proposed Changes

### 1. Store Update (`src/stores/rosterStore.ts`)
- Modify the `getShiftsForDate` function to include sorting logic.
- Define a priority map for shifts: `{ 'A': 1, 'E': 2, 'B': 3, 'C': 4 }`.
- Sort the resulting array using this priority map before returning it.

### 2. UI Verification
- Ensure the `CalendarWidget.tsx` (and any other components using `getShiftsForDate`) correctly displays the sorted list.
- Since `CalendarWidget` uses `flex-wrap`, the sorted order will be visible left-to-right (or top-to-bottom if changed to a list).

## Success Criteria
- [x] Staff members are consistently sorted by A -> E -> B -> C in the Calendar Widget's day details.
- [x] The sorting correctly handles cases where some shift types are missing.
- [x] The logic is centralized in the store to ensure consistency across the app.
