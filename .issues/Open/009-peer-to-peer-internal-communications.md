# Issue: Peer-to-Peer Internal Communications Redesign

## Description
The current internal communication system is too centralized and lacks distinction between different conversations. Users, especially the GM, cannot easily see who they are currently talking to, and staff members are limited in who they can message. The system should be redesigned to support individual, private chat threads between any two staff members.

## Requirements
- **Chat Sidebar**: Add a sidebar to the `MessagingPanel` listing all staff members and the GM.
- **Threaded Conversations**: Selecting a user from the sidebar should open a focused chat thread with that specific person.
- **User Distinction**: The UI must clearly indicate who the current active conversation is with.
- **Universal Messaging**: Allow any staff member to initiate a chat with any other staff member, not just the GM.
- **Unread Indicators**: Show visual indicators in the sidebar for users who have sent unread messages.
- **Announcements**: Maintain the ability for GMs to send hotel-wide announcements, but separate them from private chats.
- **Message Store Update**: Update `messageStore.ts` and Firestore queries to efficiently fetch and organize messages by conversation pairs (sender/receiver).

## Related Files
- `src/components/messaging/MessagingPanel.tsx`
- `src/stores/messageStore.ts`
- `src/types/index.ts`
