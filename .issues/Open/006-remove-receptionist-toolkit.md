# Issue: Remove Receptionist Toolkit from HotelInfoPanel

## Description
Under the hotel information section (`HotelInfoPanel.tsx`), the "Receptionist Toolkit" exists but does not work and does not serve any purpose in its current state. It should be completely removed, along with all related unnecessary code (stats calculation, store subscriptions, and icons).

## Requirements
- Remove the "Receptionist Toolkit" UI section from `HotelInfoPanel.tsx`.
- Remove `useRoomStore` and `useCalendarStore` usage within `HotelInfoPanel.tsx` as they are only used for these non-functional stats.
- Remove `todayArrivals` and `occupancyRate` logic.
- Remove the `ShieldCheck` icon import and any other toolkit-only imports.
- Remove the unused `tour_prices` field from the `HotelInfoData` interface.

## Related Files
- `src/components/hotel/HotelInfoPanel.tsx`
