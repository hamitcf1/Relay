# Modern and Compact Workspaces

Status: design approved in conversation on 2026-09-08; implementation pending.

## Purpose and historical reference

Offer the current Modern workspace and an optional Compact workspace using the same current modules, live data and permissions. Commit f3ca367 (2026-07-18) is the interaction reference: desktop shift tools were fully embedded in two independently scrolling columns; Operations displayed one selected module. Its mobile grid is not the chosen new mobile behavior.

Do not restore attendance declaration, cash handover, removed rooms functionality, historical themes, or old business logic.

## User preference

Modern remains the default for existing and new users. Each user can switch independently from profile quick controls or personal Appearance settings, with illustrated selection cards. This preference follows the account across devices. Personal Appearance must be available to staff without granting access to GM hotel settings.

Persist workspaceMode (modern/compact), separate mobile and desktop collapsed-card maps, and last compact operation module in UserSettings. Missing or invalid fields use defaults. Account changes clear transient layout state. Failed saves show a localized error and allow retry; do not claim persistence succeeded. Never overwrite unrelated theme/language preferences when saving layout fields.

## Compact desktop

The main sidebar has Shift, Operations and AI; profile and view switching sit at its bottom. Shift contains fully functional module cards, not launcher cards or summaries. Two independently scrolling columns fill available height.

Initial left column: notes, roster, blacklist. Initial right column: hotel-info, currency, menu, calendar. All cards start expanded. Users can collapse cards; personal desktop state is remembered. Keep current roster functionality, including full published roster visibility for hotel staff and GM-only editing.

Operations has a narrow collapsible vertical module list and one active full module. Overview is first and the initial selection; thereafter remember the last permitted selection. Remaining order and visibility follow hotel navigation settings. Include current modules such as cards-loans; exclude removed modules. Overview stays available here even though the current registry assigns it to the overview area.

## Compact mobile

Bottom navigation: Shift, Operations, AI, Profile. Shift uses one scrolling column of expandable full modules; only notes is expanded initially. Multiple modules may stay open. Remember mobile expansion independently from desktop. Flatten hotel column order as left column then right column. Header summaries use existing data only (e.g. open notes count or today's menu), and must not reveal role-restricted information.

Operations has a top selector showing the active module. Activating it opens a bottom sheet containing all permitted Operations modules. Selection closes the sheet and displays the module in place. Support Escape, focus containment/return, safe-area spacing and localized labels.

A floating plus button opens the existing configured quick-action menu, positioned above bottom navigation and away from content controls. On desktop it sits at the workspace lower right.

## Hotel layout management

Add a Compact layout section to Settings → Navigation. GM administrators reorder the seven Shift modules and move them between columns with drag/drop, with keyboard/touch-friendly move controls as alternatives. Publish hotel-wide using the existing navigation transaction/version. Modern settings and compact columns live in the same versioned document; neither editor overwrites the other's fields. Reject stale publication and show current server configuration with clear localized conflict feedback.

Layout normalization removes unknown/duplicate entries, inserts missing supported modules at their default column end, accepts empty columns and handles absent configuration. Role filtering happens after normalization. Existing hotel permissions and hidden-module rules apply to both modes. Switching hotels must not carry drafts or layouts across hotels.

## Navigation and editing safety

Reuse one module renderer and shared subscriptions; changing layout must not start duplicate listeners or copy business logic. Modern navigation remains intact.

Resolve notifications/deep links to a module regardless of mode. In Compact, Shift destinations expand and scroll to the target card; Operations destinations select the corresponding tab. Modern roster → Compact focuses roster. Compact Operations → Modern preserves the selected module. Compact Shift → Modern opens its last focused module, falling back to overview.

Before a mode switch that would unmount dirty forms, block the switch and offer stay or explicitly discard; do not silently lose edits. Use centralized dirty-form registration for local note, sale, complaint, message and settings drafts, and any additional editable module discovered during implementation. Server-saved roster drafts are already preserved and are not discarded. Changing views alone must not mutate business data.

## Styling and validation

Use current Light/Dark and user accent tokens in both modes; support Turkish, English and Russian. Modern remains default. No new UI framework is required.

Verify desktop independent scrolling, mobile accordion defaults/persistence, all Operations selections, role enforcement, direct links, safe view switches, account isolation, hotel layout publication/conflicts and fallback with legacy missing settings. Exercise actual note creation and roster editing in demo; verify the same result in both modes. Visually inspect local Chrome at desktop/mobile sizes with menus and dialogs open. Run build, lint and relevant Playwright scenarios, then full regression once integration is complete. Deliver commits and a PR on a codex/ branch, with a running local preview.
