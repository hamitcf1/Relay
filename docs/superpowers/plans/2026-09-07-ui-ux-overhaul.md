# Relay UI/UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Relay's authenticated application around a priority-first overview, responsive configurable navigation, a shared roster workflow, and a restrained Light/Dark visual system.

**Architecture:** A central module registry feeds every navigation surface. Hotel-scoped published layout plus role overlays are resolved separately from user-scoped theme preferences, while roster drafts remain separate from published weekly schedules. Existing React, Zustand, Firebase, Tailwind, and Radix patterns remain in place.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3.4, Zustand 5, Firebase/Firestore 11, Radix UI, Framer Motion, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-07-ui-ux-overhaul-design.md`

## Global Constraints

- Keep work on `codex/ui-ux-overhaul` and deliver only through a pull request.
- Keep only Light and Dark themes and curated accessible accents.
- Keep semantic critical, warning, and success colors independent from the accent.
- Every employee can view the complete published roster.
- Only authorized administrators can edit shared navigation and roster drafts.
- Unusual shifts, leave, and short rest periods are valid and produce no conflict.
- Detect conflicts only when concurrent writers change the same shared field or roster cell.
- Run and share the local application after each visual milestone.
- Keep each commit buildable and reviewable.

---

### Task 1: Theme tokens and shared application primitives

**Files:**
- Modify: `src/index.css`
- Modify: `src/stores/themeStore.ts`
- Modify: `src/types/index.ts`
- Modify: `src/components/settings/AppearanceOptions.tsx`
- Create: `src/components/layout/PageFrame.tsx`
- Create: `src/components/ui/status-indicator.tsx`
- Modify: `tests/e2e/live-demo.spec.ts`

**Interfaces:**
- Produces: `type Theme = 'light' | 'dark'`
- Produces: `ACCENT_COLORS: readonly AccentColor[]`
- Produces: `PageFrame({ eyebrow, title, description, action, filters, children })`
- Produces: `StatusIndicator({ tone, label })`

- [ ] **Step 1: Add a failing theme migration and accessibility scenario**

Add a Playwright scenario that enters the manager demo, opens Appearance, verifies only Light and Dark choices exist, selects every accent swatch, and checks the selected swatch has `aria-pressed="true"`.

- [ ] **Step 2: Run the focused test**

Run: `npx playwright test tests/e2e/live-demo.spec.ts --project=chromium -g "theme and accent"`

Expected: FAIL because five legacy themes remain.

- [ ] **Step 3: Implement the two-theme token system**

Replace theme cycling with:

```ts
export type Theme = 'light' | 'dark'
export const ACCENT_COLORS = [
  { key: 'slate-blue', value: '207 30% 42%' },
  { key: 'amber', value: '38 72% 46%' },
  { key: 'teal', value: '166 42% 38%' },
  { key: 'violet', value: '263 36% 50%' },
  { key: 'rose', value: '350 48% 48%' },
] as const
```

Map `sepia` to Light and `comfort`/`midnight` to Dark in `syncFromUser`. Refactor CSS into one slate Light root and one slate Dark override. Keep semantic state variables fixed.

- [ ] **Step 4: Add PageFrame and StatusIndicator**

Use semantic `main`, `header`, and `section` elements. Keep content width, page padding, title scale, focus rings, and responsive action placement in one shared component.

- [ ] **Step 5: Verify and commit**

Run: `npm run build && npm run lint && npx playwright test tests/e2e/live-demo.spec.ts --project=chromium -g "theme and accent"`

Commit: `feat: simplify Relay theme system`

- [ ] **Step 6: Start the local server for visual checkpoint 1**

Run: `npm run dev -- --host 0.0.0.0`

Share the local URL and review Light/Dark, accents, typography, focus, and mobile spacing before Task 2.

---

### Task 2: Central module registry and responsive application shell

**Files:**
- Create: `src/config/moduleRegistry.ts`
- Create: `src/lib/navigation.ts`
- Create: `src/stores/navigationStore.ts`
- Rewrite: `src/components/layout/AppSidebar.tsx`
- Rewrite: `src/components/layout/MobileNav.tsx`
- Create: `src/components/layout/AllTabsDirectory.tsx`
- Create: `src/components/layout/QuickActionMenu.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `tests/e2e/responsive-mobile.spec.ts`
- Modify: `tests/e2e/live-demo.spec.ts`

**Interfaces:**
- Produces: `MODULE_REGISTRY: readonly ModuleDefinition[]`
- Produces: `resolveNavigation(registry, publishedLayout, role, permissions): ResolvedNavigation`
- Produces: `useNavigationStore` with `resolved`, `subscribe`, and `openAllTabs`

- [ ] **Step 1: Write failing desktop and mobile navigation scenarios**

Assert desktop shows the task-focused sidebar and All Tools. Assert mobile shows three configurable destinations, a central New action, and All Tabs. Open All Tabs, search for “Takvim,” select it, and verify the directory closes.

- [ ] **Step 2: Run the scenarios and confirm failure**

Run: `npx playwright test tests/e2e/responsive-mobile.spec.ts tests/e2e/live-demo.spec.ts`

- [ ] **Step 3: Define the registry and pure resolver**

Create stable definitions for every existing destination. The resolver applies shared sections, role overlays, permission filtering, and safe fallback insertion without mutating inputs.

- [ ] **Step 4: Replace duplicated navigation arrays**

Make AppSidebar, MobileNav, AllTabsDirectory, and QuickActionMenu consume `ResolvedNavigation`. Keep the center action and All Tabs positions fixed on mobile.

- [ ] **Step 5: Move Dashboard routing to registry identifiers**

Keep current lazy-loaded modules but route selection through registry destinations. Preserve deep-link query parameters during this task.

- [ ] **Step 6: Verify and commit**

Run: `npm run build && npm run lint && npx playwright test tests/e2e/responsive-mobile.spec.ts tests/e2e/live-demo.spec.ts`

Commit: `feat: add responsive registry-driven navigation`

- [ ] **Step 7: Share visual checkpoint 2**

Review desktop expanded/collapsed sidebar, mobile bottom bar, quick actions, All Tabs search, safe areas, and GM/employee visibility in the running local app.

---

### Task 3: Hotel-managed navigation editor and live publication

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/navigationDefaults.ts`
- Create: `src/stores/navigationEditorStore.ts`
- Create: `src/components/settings/navigation/NavigationEditor.tsx`
- Create: `src/components/settings/navigation/NavigationSectionEditor.tsx`
- Create: `src/components/settings/navigation/NavigationPreview.tsx`
- Modify: `src/components/settings/HotelSettings.tsx`
- Modify: `src/stores/hotelStore.ts`
- Modify: `firestore.rules`
- Modify: `tests/e2e/live-demo.spec.ts`

**Interfaces:**
- Produces: `HotelNavigationConfig`, `NavigationSection`, `RoleNavigationOverlay`
- Produces: `publishNavigation(hotelId, draft, expectedVersion): Promise<PublishResult>`
- Consumes: `MODULE_REGISTRY` and `resolveNavigation`

- [ ] **Step 1: Add failing editor and stale propagation scenarios**

In manager demo, rename a section, drag one module, hide one role-specific item, change a mobile destination, publish, and verify sidebar/mobile preview order. Add a stale-version scenario that expects publication rejection.

- [ ] **Step 2: Run and confirm failure**

Run: `npx playwright test tests/e2e/live-demo.spec.ts --project=chromium -g "navigation editor"`

- [ ] **Step 3: Add typed defaults and migration**

Create a versioned default layout derived from stable module IDs. Add a parser that ignores unknown IDs and inserts required destinations.

- [ ] **Step 4: Build the drag-and-drop editor without a new dependency**

Use native pointer/keyboard controls and explicit Move Up/Down fallbacks. Support section rename, visibility, section movement, mobile slots, quick actions, shared/role modes, and desktop/mobile preview.

- [ ] **Step 5: Implement transactional publication**

Use `runTransaction` to compare `expectedVersion`, write the next version with `updatedBy` and `updatedAt`, and return a typed stale result. Subscribe all clients through the hotel snapshot.

- [ ] **Step 6: Enforce rules**

Allow hotel members to read published configuration. Allow GM/authorized administrators to publish. Keep authorization independent from item visibility.

- [ ] **Step 7: Verify and commit**

Run: `npm run build && npm run lint && npx playwright test tests/e2e/live-demo.spec.ts --project=chromium -g "navigation editor"`

Commit: `feat: let hotels manage shared navigation`

- [ ] **Step 8: Share visual checkpoint 3**

Review drag-and-drop, keyboard ordering, section rename, role overlays, previews, live update behavior, and conflict messaging locally.

---

### Task 4: Priority-first Operations Overview

**Files:**
- Rewrite: `src/components/dashboard/OperationsOverview.tsx`
- Create: `src/components/dashboard/PriorityQueue.tsx`
- Create: `src/components/dashboard/HandoverSummary.tsx`
- Create: `src/components/dashboard/DailySummary.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `tests/e2e/live-demo.spec.ts`
- Modify: `tests/e2e/responsive-mobile.spec.ts`

**Interfaces:**
- Produces: `PriorityQueueItem` and deterministic `buildPriorityQueue(notes, compliance, payments)`
- Consumes: current note, compliance, sales, and payment stores without changing their persistence.

- [ ] **Step 1: Add failing priority and empty-state scenarios**

Assert critical/overdue items appear before handover and metrics, each item exposes context and action, and an empty queue presents a useful next action.

- [ ] **Step 2: Confirm failure**

Run: `npx playwright test tests/e2e/live-demo.spec.ts tests/e2e/responsive-mobile.spec.ts -g "operations overview"`

- [ ] **Step 3: Extract the queue model**

Normalize existing sources into stable queue items with `id`, `tone`, `title`, `context`, `age`, `owner`, and `action`. Keep ordering deterministic: critical, overdue, warning, then newest relevant item.

- [ ] **Step 4: Build the responsive overview**

Use PageFrame. Place queue first, handover second, and DailySummary below/collapsible. Use a single column on mobile and a restrained secondary column on wide screens.

- [ ] **Step 5: Verify and commit**

Run: `npm run build && npm run lint && npx playwright test tests/e2e/live-demo.spec.ts tests/e2e/responsive-mobile.spec.ts -g "operations overview"`

Commit: `feat: prioritize actionable work on overview`

- [ ] **Step 6: Share visual checkpoint 4**

Review populated and empty overview states, GM/employee differences, action placement, and mobile priority order locally.

---

### Task 5: Shared roster drafts and publication

**Files:**
- Modify: `src/types/index.ts`
- Rewrite: `src/stores/rosterStore.ts`
- Rewrite: `src/components/roster/RosterMatrix.tsx`
- Create: `src/components/roster/ShiftSelector.tsx`
- Create: `src/components/roster/RosterViewSwitcher.tsx`
- Create: `src/components/roster/MobileRosterDayView.tsx`
- Create: `src/components/roster/MobileRosterEmployeeView.tsx`
- Create: `src/components/roster/MobileRosterMatrix.tsx`
- Modify: `firestore.rules`
- Modify: `tests/e2e/live-demo.spec.ts`
- Modify: `tests/e2e/responsive-mobile.spec.ts`

**Interfaces:**
- Produces: `RosterDraft`, `RosterCellEdit`, `PublishedRosterVersion`
- Produces: `updateDraftCell(hotelId, weekId, edit, expectedCellVersion)`
- Produces: `publishRoster(hotelId, weekId, expectedDraftVersion)`

- [ ] **Step 1: Add failing visibility, selector, draft, and mobile-view scenarios**

Verify employees see the full published team. Verify clicking a cell opens a selector rather than cycling. Verify GM edits autosave to a shared draft, employees cannot see it, and Day/Employee/Matrix mobile views are selectable.

- [ ] **Step 2: Confirm failure**

Run: `npx playwright test tests/e2e/live-demo.spec.ts tests/e2e/responsive-mobile.spec.ts -g "weekly roster"`

- [ ] **Step 3: Introduce draft and published models**

Keep legacy published documents readable. Store draft cell values with `version`, `updatedBy`, and `updatedAt`. Treat only a same-cell stale version as conflict.

- [ ] **Step 4: Build desktop selectors and shared draft state**

Open a Radix selector on cell click. Support configured shifts, OFF/leave, and empty. Add multi-select, apply-to-days, previous-week copy, autosave state, editor identity, and keep/publish exit prompt.

- [ ] **Step 5: Build all three mobile views**

Default to Day view with all staff, provide Employee and horizontally scrollable Matrix views, and persist the last view in user settings.

- [ ] **Step 6: Add atomic publication and rules**

Publish the full week transactionally. Let all hotel members read published documents, restrict draft read/write and publication to authorized administrators.

- [ ] **Step 7: Verify and commit**

Run: `npm run build && npm run lint && npx playwright test tests/e2e/live-demo.spec.ts tests/e2e/responsive-mobile.spec.ts -g "weekly roster"`

Commit: `feat: overhaul shared weekly roster planning`

- [ ] **Step 8: Share visual checkpoint 5**

Review desktop editing, all three mobile views, employee full-team visibility, draft indicators, publication, and same-cell conflict resolution locally.

---

### Task 6: Common page-frame migration

**Files:**
- Modify: authenticated panels under `src/components/{messaging,feedback,sales,tours,loans,pricing,team,activity,hotel,calendar,settings}/`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `tests/e2e/live-demo.spec.ts`
- Modify: `tests/e2e/responsive-mobile.spec.ts`

**Interfaces:**
- Consumes: `PageFrame`, shared status, button, form, empty-state, and navigation components from Tasks 1–3.

- [ ] **Step 1: Inventory module layouts**

Record each module's primary action, filters, list/detail behavior, empty state, loading state, and mobile back path in the plan checklist before editing.

- [ ] **Step 2: Add one failing navigation/context scenario per layout family**

Cover list/detail, data table, settings form, and utility widget families. Assert headings, one primary action, mobile back behavior, and restored URL filter state.

- [ ] **Step 3: Migrate modules family by family**

Use PageFrame, remove unnecessary nested cards, replace interruptive simple modals with detail panels where practical, and keep existing persistence behavior unchanged.

- [ ] **Step 4: Verify each family before continuing**

Run the focused Playwright scenario plus `npm run build` after each family.

- [ ] **Step 5: Commit**

Run: `npm run build && npm run lint && npm run test:e2e`

Commit: `refactor: unify authenticated page layouts`

- [ ] **Step 6: Share visual checkpoint 6**

Review every navigation destination in desktop and mobile at the running local URL. Record and fix layout regressions before final polish.

---

### Task 7: Accessibility, migration cleanup, and final PR

**Files:**
- Modify: `src/index.css`
- Modify: `src/stores/themeStore.ts`
- Modify: `src/components/settings/AppearanceOptions.tsx`
- Modify: `src/components/onboarding/TourOverlay.tsx`
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/tr.ts`
- Modify: `src/i18n/ru.ts`
- Modify: `tests/e2e/auth-flow.spec.ts`
- Modify: `tests/e2e/live-demo.spec.ts`
- Modify: `tests/e2e/responsive-mobile.spec.ts`

**Interfaces:**
- Consumes all public interfaces from Tasks 1–6.

- [ ] **Step 1: Remove legacy theme and navigation residue**

Search for `sepia|comfort|midnight`, duplicate hardcoded module arrays, legacy mobile grid entry points, and old roster cell cycling. Keep only explicit migration mappings.

- [ ] **Step 2: Test keyboard and reduced-motion behavior**

Add scenarios that traverse sidebar, All Tabs, quick actions, navigation editor, overview actions, and roster selectors using the keyboard. Emulate reduced motion and verify essential state changes remain usable.

- [ ] **Step 3: Complete translations and demo defaults**

Provide English, Turkish, and Russian copy for new navigation, conflict, draft, publishing, empty, and error states. Update demo hotel and user defaults so every review flow is available.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run build
npm run lint
npm run test:e2e
git diff --check
```

Expected: build succeeds, lint has no new errors, all Playwright projects pass, and no whitespace errors remain.

- [ ] **Step 5: Conduct final local visual review**

Share the running local URL. Review GM and employee roles at desktop and mobile sizes, both themes, every accent, navigation publication, overview states, and roster publication. Fix accepted findings and repeat focused checks.

- [ ] **Step 6: Commit and open the pull request**

Commit: `test: verify Relay UI UX overhaul`

Push `codex/ui-ux-overhaul` and open a draft PR describing the new behavior, migration, authorization, validation, and local review results. Do not merge without user approval.
