# ISSUE-003: UI Consolidation - Operations Hub as Tab & Action Menu Relocation

## Description
The current UI has the "Operations Hub" as a separate page, which disrupts the flow. Additionally, the "Actions" button in the header is taking up too much space and should be consolidated into the User Profile menu for a cleaner "Cyber-Concierge" aesthetic.

## Proposed Changes

### 1. Operations Hub Integration
- **Relocate Content:** Move the content of `OperationsPage.tsx` into a new tab within `DashboardPage.tsx`.
- **Layout Change:**
    - Wrap the current dashboard grid (Shift Notes, Logs, Calendar, etc.) in a `TabsContent` component (e.g., `value="overview"`).
    - Add a `TabsContent` for "Operations" containing the `MessagingPanel`, `FeedbackSection`, etc.
    - Add a `TabsList` in the dashboard to toggle between "Overview" and "Operations Hub".
- **Navigation:** Remove the `LayoutGrid` link from the header.

### 2. Header Consolidation (Profile Menu)
- **Remove Actions Button:** Delete the standalone "Actions" (Plus) button from the header.
- **Enhance Profile Menu:** Move the following items into the `User Profile` dropdown menu:
    - **AI Assistant** (with Sparkles icon).
    - **New Log** (with Plus icon).
    - **Rooms Manager** (Bed icon).
    - **Start/End Shift** logic (Play/Stop icons).
- **Group Actions:** Use `DropdownMenuGroup` and `DropdownMenuLabel` to logically separate "Personal" actions (Logout) from "Operational" actions (New Log, AI).

### 3. Routing Cleanup
- Update `App.tsx` to remove the `/operations` route.
- Ensure `DashboardPage` handles the tab state (perhaps using URL search params or just local state).

## Success Criteria
- [x] Operations Hub is accessible via a tab on the Dashboard without a full page reload.
- [x] The header is significantly cleaner with fewer standalone buttons.
- [x] All operational actions (AI, Logs, Shift management) are logically grouped under the profile photo dropdown.
- [x] Responsive view: The profile menu remains functional on mobile.

**Status: COMPLETED**
- Operations Hub integrated into Dashboard tabs.
- Header actions consolidated into User Profile menu.
- Redundant routes and files removed.
