# Relay UI/UX Overhaul Design

## Purpose

Relay's application interface will be rebuilt around one operational question: **What needs attention now?** The overhaul covers the visual system, desktop and mobile navigation, hotel-level navigation customization, Operations Overview, Weekly Roster, settings, and the common layout used by remaining modules.

Work stays on `codex/ui-ux-overhaul`, uses reviewable commits, and ships through a pull request. After each visual milestone, the local application will be run and shared for direct desktop and mobile review.

## Product principles

- Put urgent and overdue work before descriptive metrics.
- Keep frequent actions visible and place infrequent tools behind progressive disclosure.
- Use color for action and state rather than decoration.
- Preserve context across navigation and detail views.
- Keep hotel-wide configuration separate from personal display preferences.
- Let every employee view the full published roster.
- Prevent silent data loss during concurrent administration.

## Visual system

Relay uses a calm, cool slate direction that remains recognizably close to the current product.

- Only Light and Dark themes remain. Sepia, Comfort, and Midnight preferences migrate to the closest supported theme.
- Users choose from five to seven curated, accessible accent colors.
- Accent colors affect primary actions, active navigation, and focus indicators.
- Critical, warning, and success colors remain semantic and independent of the chosen accent.
- Both themes share one spacing, typography, radius, elevation, and motion system.
- Cards appear only when they communicate a meaningful group or layer.
- Text, icons, and status markers never rely on color alone.
- Numeric and schedule data use tabular figures.
- Keyboard focus remains visible and motion respects reduced-motion preferences.

Theme and accent are personal user settings and do not affect hotel navigation.

## Application shell and navigation

### Central module registry

All navigation surfaces consume one module registry. Each module declares a stable identifier, localized default label, icon, destination, required permission, supported quick actions, and whether it must remain reachable outside primary navigation.

The desktop sidebar, mobile bottom bar, All Tabs directory, quick-action menu, and navigation editor derive from this registry. Unknown or retired identifiers are ignored safely. Newly introduced required modules fall into a default section.

### Desktop

Desktop uses a task-focused fixed sidebar. Four to six frequent destinations stay visible. Less frequent modules live under All Tools. The sidebar can collapse, with accessible labels retained through tooltips. Active state does not rely on color alone.

### Mobile

Mobile uses a five-position bottom bar:

1. configurable primary destination;
2. configurable primary destination;
3. fixed central quick-action button;
4. configurable primary destination;
5. fixed All Tabs button.

All Tabs opens a full-screen directory with search, administrator-defined sections, and the published module order. Selecting a module closes the directory and opens its destination.

The central button opens a configurable action menu. Defaults are shift note, complaint, sale, message, and calendar entry. Administrators can reorder and hide supported actions. The button itself cannot be removed.

## Hotel-managed navigation

The hotel has one shared base layout with role-specific differences layered over it. Administrators can reorder modules with drag and drop, show or hide modules, move modules between sections, rename sections, assign the three configurable mobile destinations, reorder quick actions, and preview desktop and mobile results.

Role differences change visibility, order, and section placement while inheriting everything else. Hiding an item affects discovery only; authorization remains independent.

The published layout carries a monotonically increasing version and audit metadata. Publication uses a Firestore transaction. If another administrator has published a newer version, stale publication is rejected and the current layout is loaded with the editor's identity. No edit is silently overwritten.

All hotel users subscribe to the published layout, so a successful publication updates open sessions without sign-out or reload.

## Operations Overview

Operations Overview is the default destination and uses a priority queue.

1. The header states the operational period and provides New Record.
2. Critical and overdue records appear in one actionable queue with context, age, owner when available, and the relevant next action.
3. Shift handover follows as a secondary block.
4. Today's totals and management metrics appear below or in a collapsible summary.
5. Empty states explain that no urgent work exists and offer the next useful action.

Desktop may use a secondary column for compact status. Mobile remains single-column and avoids compressed tables. GM-only metrics may vary by role, while the main operational hierarchy stays consistent.

## Weekly Roster

### Visibility and permissions

Every employee can view the complete published roster for the whole team. Authorized administrators edit the shared draft and publish it. Employees cannot see unpublished changes.

### Desktop editing

Desktop retains employees in rows and days in columns. Selecting a cell opens a compact selector containing configured shifts, leave, and empty states; clicking never cycles values.

The matrix supports multi-cell selection, applying one shift across days, and copying a previous week. Shift colors are restrained and accessible. Every assignment also shows a code or label and time range.

### Draft and publication

Edits autosave to a shared draft. Authorized administrators see the same draft and who made each change. Unusual schedules, leave-day changes, and short rest periods do not produce conflicts or block publication.

Only a concurrent edit to the same roster cell is a conflict. Different cells can be edited concurrently. Same-cell collisions require explicit resolution so neither value disappears silently.

When leaving with unpublished changes, an administrator can keep the draft or publish it. Publication creates one coherent roster version and updates employees' subscribed published view.

### Mobile views

Mobile offers three selectable views and remembers the user's last choice:

1. day view showing every employee and assignment for the selected day;
2. employee view showing one employee's full week;
3. horizontally scrollable weekly matrix showing the entire team.

Day view is the default. Administrators receive touch-friendly selectors where editing is practical. Employees see the same complete published data without edit controls.

## Common page structure

All modules adopt one responsive frame: concise title and context, one clear primary action where applicable, filters and view controls, and task-appropriate content. Loading skeletons, empty states, inline errors, and confirmation patterns remain consistent.

Desktop list/detail modules use two panels when it improves scanning. On mobile, the list occupies the screen and a selected record opens as a routed detail or full-height panel with clear back navigation. Filter and selection state is represented in the URL where practical.

Modals are reserved for decisions that must interrupt the flow. Simple viewing and editing use inline expansion, routed details, or slide-over panels.

## Settings

Settings is reorganized into Hotel details, Navigation and quick actions, Shifts and roster, Team and roles, Reports, and Personal appearance.

Navigation settings include desktop and mobile previews. The editor distinguishes shared layout from role differences and makes inherited values clear. Personal appearance contains Light/Dark theme, curated accent, motion preference, and supported identity options.

## Data flow

Hotel settings store shared navigation, role overlays, quick actions, published version, and audit metadata. User settings store theme, accent, and last roster view.

Navigation resolution loads the module registry, applies the hotel's shared layout, applies the role overlay, removes destinations forbidden by authorization, and adds safe fallbacks for missing required destinations. Invalid configuration falls back safely and records a diagnosable error.

Roster drafts and published rosters remain separate. Draft writes include cell-level edit metadata. Publication changes the published version atomically.

## Authorization

- Hotel members may read their hotel's published navigation and roster.
- Authorized administrators may manage navigation and roster drafts and publish them.
- Employees cannot read drafts or write shared configuration.
- Firestore rules enforce hotel membership and role. Hidden navigation never substitutes for authorization.

## Migration

- Hotels without navigation configuration receive a versioned default layout.
- Existing themes map deterministically to Light or Dark.
- Unsupported accent values map to the nearest curated accent.
- Existing published roster data remains readable while draft and version metadata is introduced.
- Live demo data receives the same defaults.

## Delivery

All work is committed to `codex/ui-ux-overhaul` and submitted through a pull request. Commits remain buildable and reviewable:

1. design tokens, Light/Dark theme, curated accents, and shared primitives;
2. responsive shell and central module registry;
3. managed navigation, persistence, authorization, and live updates;
4. Operations Overview priority queue;
5. Weekly Roster drafts, selectors, publication, and responsive views;
6. remaining modules migrated to the common page frame;
7. accessibility, responsive polish, migration cleanup, and end-to-end verification.

## Review workflow

After every visual milestone, the local development server is run and its direct URL is shared. The product owner reviews real behavior on desktop and mobile before the next milestone. Review covers GM and employee roles. Mockups guide decisions, but implemented UI approval uses the running local application.

## Verification

Verification covers production build and lint, responsive navigation for GM and employee roles, keyboard operation, focus, reduced motion, contrast, every theme/accent combination, hotel layout publication and live propagation, stale publication rejection, role overlays, authorization fallbacks, Operations Overview states, shared roster draft concurrency and publication, all mobile roster views, full-team visibility, legacy data migration, and local visual review at each milestone.
