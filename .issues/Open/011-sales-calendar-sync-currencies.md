# Issue: Sync Sales to Calendar and Expand Currency Support

## Description
Currently, tour and transfer sales automatically create calendar events, but updates to these sales (like collecting additional payments) are not reflected in the calendar. Additionally, the system only supports EUR and TRY, and lacks support for USD, GBP, and partial payments in multiple currencies.

## Requirements
- **Automatic Sync**: Update `collectPayment` in `salesStore.ts` to also update the `collected_amount` in the linked `calendar_event_id`.
- **Currency Expansion**: Add 'USD' and 'GBP' to the `currency` type in `Sale` and `CalendarEvent`.
- **Multi-Currency Support**: Support partial payments where a portion is paid in TL and another portion in foreign currency (requires rethinking the `collected_amount` field to support a breakdown or separate fields).
- **Exchange Rates**: Consider adding a simple manual exchange rate input or a way to define prices in one currency and collect in another.

## Related Files
- `src/stores/salesStore.ts`
- `src/stores/calendarStore.ts`
- `src/components/sales/SalesPanel.tsx`
- `src/types/index.ts`
