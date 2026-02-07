# Issue: Improve GM Announcements Reach and Visibility

## Description
GM announcements are currently not reaching all users reliably, and they are missing from the Operational Hub. The notification navigation also needs verification to ensure clicking a notification takes the user to the correct location.

## Requirements
- **Operational Hub Visibility**: Add an "Announcement History" or "Recent Announcements" list to the `MessagingPanel` or as a new sub-tab in the Operations tab.
- **Broadcast Reliability**: Ensure that when a GM sends a message to 'all', it appears in the `AnnouncementBanner` for every staff member and persists until dismissed.
- **Notification Navigation**: Verify the `link` property in `MessagingPanel.tsx` when adding notifications for announcements. Ensure it correctly routes to the conversation or announcement view.
- **Read Status Tracking**: Ensure that dismissing an announcement banner marks it as read/dismissed specifically for that user.

## Related Files
- `src/components/announcements/AnnouncementBanner.tsx`
- `src/components/messaging/MessagingPanel.tsx`
- `src/components/messaging/AnnouncementModal.tsx`
- `src/stores/messageStore.ts`
- `src/stores/notificationStore.ts`
