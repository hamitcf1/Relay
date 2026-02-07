# Issue: Remove Deprecated "New Log" Feature

## Description
The "New Log" feature is now deprecated and no longer serves any purpose in the application. All related UI elements, buttons, and components should be removed to clean up the interface and codebase.

## Requirements
- Remove the "New Log" button from the dashboard actions menu in `DashboardPage.tsx`.
- Remove the `NewLogModal` component usage and its related state (`isNewLogOpen`).
- Delete the `src/components/logs/NewLogModal.tsx` file.
- Clean up any unused log-related logic or store actions in `logsStore.ts` if they are no longer needed by other features (like the Log Feed).

## Related Files
- `src/pages/DashboardPage.tsx`
- `src/components/logs/NewLogModal.tsx`
- `src/stores/logsStore.ts`
