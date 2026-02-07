# Issue: Add Secret Info Section to Hotel Information

## Description
Hotels need a secure place to store sensitive information such as Agency Extranet logins and KBS (Kimlik Bildirim Sistemi) credentials. This should only be accessible via a specific "Safe Password".

## Requirements
- **Secure Storage**: Add a `secret_info` field to the hotel settings in Firestore.
- **Password Protection**: Implement a password prompt when attempting to view or edit the "Secret Info" section in the `HotelInfoPanel`.
- **UI Component**: Add a new collapsible section in `HotelInfoPanel.tsx` labeled "Gizli Bilgiler" (Secret Info).
- **Permission Control**: Only users with GM role should be able to set or change the "Safe Password", but all authorized users (with the password) can view the info.

## Related Files
- `src/components/hotel/HotelInfoPanel.tsx`
- `src/stores/hotelStore.ts`
- `src/types/index.ts`
