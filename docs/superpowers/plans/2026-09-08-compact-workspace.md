# Compact Workspace Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in this session. Track steps with checkboxes.

**Goal:** Add an account-selected Compact workspace alongside the current Modern workspace.

**Architecture:** Share module rendering, authorization and live subscriptions. Separate only navigation and layout; persist personal preferences on the user and published column configuration on the hotel.

**Tech Stack:** React 19, TypeScript, Zustand, Firebase, existing Radix UI, Tailwind, Playwright.

**Spec:** docs/superpowers/specs/2026-09-08-compact-workspace-design.md

## Global Constraints

- Modern remains default. Keep current themes, roster behavior and operational data.
- Do not restore attendance declaration, cash handover or removed modules.
- Use codex/compact-workspace and PR workflow; no direct main changes.
- Staff can change personal appearance without access to GM settings.
- Desktop/mobile expansion preferences are separate and account-specific.
- Local preview and actual Chrome visual verification are required.

## 1. Preference persistence and safe defaults

Files: src/types/index.ts, src/stores/authStore.ts; create src/lib/workspace.ts and tests/e2e/workspace-config.spec.ts.

- [ ] Define WorkspaceMode and CompactLayout alongside existing types; extend UserSettings with workspaceMode, compactCollapsedDesktop, compactCollapsedMobile, compactOperationTab; extend HotelNavigationConfig with compactLayout.

```ts
export type WorkspaceMode = 'modern' | 'compact'
export interface CompactLayout { left: string[]; right: string[] }
```

- [ ] Implement normalizeCompactLayout(input?: CompactLayout): CompactLayout in src/lib/workspace.ts. Use defaults left=[notes,roster,blacklist], right=[hotel-info,currency,menu,calendar]. Walk left then right, retaining only supported IDs once; append missing IDs to default columns. Do not reject empty columns.
- [ ] Add pure Playwright-runner assertions (no browser required) for absent config, duplicates, unknown IDs and missing modules. Example:

```ts
expect(normalizeCompactLayout(undefined).left).toEqual(['notes', 'roster', 'blacklist']);
expect(normalizeCompactLayout({left:['notes','notes','unknown'],right:[]}).left)
  .toEqual(['notes','roster','blacklist']);
```

- [ ] Run configuration tests, implement normalization, rerun. Update auth preference persistence to patch only changed Firestore settings paths, merge local state, support demo sessions and propagate save errors. Confirm existing consumers handle returned errors.
- [ ] Commit preference foundation after checking type compilation.

## 2. Shared rendering and mode-aware destinations

Files: src/pages/DashboardPage.tsx, src/config/moduleRegistry.ts; create src/components/workspace/ModuleContent.tsx and src/lib/workspaceNavigation.ts.

- [ ] Extract current module bodies and lazy imports to ModuleContent({moduleId, hotelId, canEdit, initialAddOpen}). Preserve each current module's actual props and Suspense boundaries; inspect DashboardPage before moving.
- [ ] Keep hotel/auth/data subscriptions in DashboardPage. Derive permitted module IDs with resolveNavigation; enforce authorization in ModuleContent as well as navigation controls.
- [ ] Define resolveWorkspaceTarget(moduleId, mode) returning {area:'shift'|'operations', moduleId}. Notes/roster/hotel-info/currency/menu/calendar/blacklist map to shift; overview and current operation modules map to operations for compact.
- [ ] Add assertions for roster, overview, messaging and invalid-target fallback; confirm Modern links still map to their original route/query.
- [ ] Run existing demo navigation/roster tests and commit the extraction before adding alternate layout.

## 3. Compact Shift cards and scrolling

Create src/components/workspace/CompactShift.tsx and CompactModuleCard.tsx; modify DashboardPage; create tests/e2e/compact-workspace.spec.ts.

- [ ] CompactShift consumes normalized columns, permitted IDs and personal collapse map; renders ModuleContent in each card. CompactModuleCard consumes id, expanded, onExpandedChange and children.
- [ ] Desktop: height-constrained grid, two min-h-0 columns with overflow-y-auto. Mobile: one overflow area, left-then-right order. Use accessible buttons with aria-expanded/aria-controls; avoid duplicate headings from shared modules.
- [ ] Persist collapse changes through partial user settings updates. Default desktop to open; default mobile to notes only. Do not let responsive changes overwrite either map.
- [ ] Add test using manager demo, switch compact and assert embedded notes/roster/hotel-info on desktop. Test mobile notes expanded and roster collapsed; expand roster and interact with current selector.

```ts
await expect(page.getByTestId('compact-card-notes')).toBeVisible();
await expect(page.getByTestId('compact-card-roster').getByRole('button', {name:/Haftalık vardiya|Weekly roster/}).first())
  .toHaveAttribute('aria-expanded', 'false');
```

- [ ] Verify independent desktop scroll by changing left scrollTop and asserting right scrollTop unchanged. Commit after focused tests.

## 4. Operations shell and personal appearance controls

Create src/components/workspace/CompactOperations.tsx, CompactNavigation.tsx, WorkspaceModeOptions.tsx; modify src/components/layout/UserNav.tsx and src/components/settings/AppearanceOptions.tsx.

- [ ] Render narrow collapsible desktop Operations list, overview first; use current role-filtered order for remaining modules. Restore last permitted selection, otherwise overview.
- [ ] Mobile selector uses existing Radix Dialog as a bottom sheet with focus handling; only active module mounts. Keep mode-independent direct links.
- [ ] Build compact main sidebar Shift/Operations/AI/profile; mobile bottom bar Shift/Operations/AI/profile. Reuse existing AI and profile actions and QuickActionMenu; float plus above safe areas.
- [ ] Add Modern/Compact preview cards to personal Appearance and quick profile toggle. Use localized copy in tr/en/ru, accessible selected state and responsive dimensions. Modern initially selected for missing preference.
- [ ] Test switching both ways, persisted preference after reload, mobile selector dismissal and messages-only content, overview initial selection. Confirm ordinary staff can reach personal controls.
- [ ] Commit shell and preference UI.

## 5. Administrator compact layout editor

Files: src/components/settings/navigation/NavigationEditor.tsx, src/stores/navigationEditorStore.ts, src/lib/navigationDefaults.ts, src/stores/hotelStore.ts; create src/components/settings/navigation/CompactLayoutEditor.tsx.

- [ ] Add editor action moveCompactModule(id: string, column: 'left'|'right', index: number). Normalize before editing; remove id from both columns then insert at bounded destination index.
- [ ] Show two ordered columns in editor with drag/drop and explicit move-column/up/down buttons. Both interactions invoke the same action and mark draft dirty.
- [ ] Include compactLayout in current versioned navigation publish transaction. Track editor hotel identity so switching hotels resets draft. Handle absent navigation without update loop; load new configuration only when safe, protect dirty drafts and report stale writes.
- [ ] Add E2E moving calendar to left, publishing, switching Compact and checking placement; verify Modern configured order survives. Exercise stale-version transaction using controlled test data; never mutate production hotel settings for tests.
- [ ] Commit administrator controls.

## 6. Deep links and unsaved edits

Create src/components/workspace/WorkspaceEditGuard.tsx; modify editable module form owners, DashboardPage and workspace navigation.

- [ ] Provide registerDirty(id: string, dirty: boolean) and requestMode(mode: WorkspaceMode). Unregister on form unmount. Identify unsaved state in note, sale, complaint, messaging and settings forms; inspect remaining editable panels for local drafts and register them.
- [ ] When dirty, retain current mode and form while showing a localized stay/discard dialog. Switch only on explicit discard; cancel preserves inputs. Persist mode only after this decision.
- [ ] Direct links to Compact shift cards set expanded state then scroll target into view after mount. Operation links select allowed tab. Modern conversion uses last focused shift module or overview.
- [ ] Test typed unsaved note survives canceled switch, confirmed switch succeeds, notification-style roster link expands collapsed card and correct operation links select messages.
- [ ] Commit guarded transitions.

## 7. Integrated verification and delivery

- [ ] Start dedicated local Vite instance and point PLAYWRIGHT_TEST_BASE_URL to it; avoid testing a stale server. Run npm run build, npm run lint -- --quiet and npm run test:e2e. Restore only generated tracked report/version artifacts created by this run.
- [ ] Inspect local Chrome desktop/mobile, Light/Dark, both modes, compact collapsed cards, full roster, Operations selector, profile, plus menu and admin editor. Check overlap, clipping, labels, focus and scroll containment.
- [ ] Verify notes and roster mutations appear in both modes, user preferences do not cross accounts, legacy missing settings load safely and forbidden modules remain inaccessible.
- [ ] Run git diff --check, review final diff and commit any verified fixes. Push branch and open PR against current main with validation evidence and known limits. Show the user the local preview; do not merge without instruction.
