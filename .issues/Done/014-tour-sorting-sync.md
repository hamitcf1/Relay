# Issue: Alphabetical Tour Sorting and Sync

## Description
Tours should be sorted alphabetically in all dropdowns and catalogues. Additionally, tour sales should remain 100% in sync with the calendar.

## Requirements
- **Alphabetical Sorting**: Update `TourCatalogue.tsx` and the tour selection dropdown in `SalesPanel.tsx` to sort tours by name.
- **Calendar Consistency**: Ensure that every tour sale creation or update triggers a corresponding calendar event action.
- **Type-Safe Sync**: Verify that `CalendarEventType` 'tour' is correctly used for all tour sales.

## Related Files
- `src/components/tours/TourCatalogue.tsx`
- `src/components/sales/SalesPanel.tsx`
- `src/stores/tourStore.ts`
- `src/stores/calendarStore.ts`
