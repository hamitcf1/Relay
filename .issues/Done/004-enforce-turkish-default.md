# ISSUE-004: Enforce Turkish as Default Language & Localization Audit

## Description
The user requires the application to default to Turkish (`tr`) and for all UI elements to have Turkish equivalents. While the `languageStore` defaults to `tr`, there are likely hardcoded English strings scattered throughout the components (e.g., button labels, placeholders, headers) that need to be replaced with localization keys (`t('...')`) or updated to Turkish.

## Scope
1.  **Store Configuration:** Confirm `src/stores/languageStore.ts` sets `language: 'tr'` as the default.
2.  **Missing Translations:** Identify keys present in `translations.en` that are missing or incomplete in `translations.tr`.
3.  **Hardcoded Strings:** Audit key components for hardcoded English text and replace them with `t()` calls.
    *   *Examples observed:* "Add", "Back to Dashboard", "Operations Hub", "Manage hotel communication...", "No events", "Update", "Delete".
4.  **New Keys:** Add missing keys to `src/stores/languageStore.ts` for any hardcoded strings found.

## Action Plan

### 1. Store Verification
- Ensure `useLanguageStore` initializes with `tr`.

### 2. Component Audit (Priority List)
- **Dashboard:** `DashboardPage.tsx`, `AppShell.tsx`
- **Operations:** `OperationsPage.tsx`
- **Calendar:** `CalendarWidget.tsx` (observed mixed language)
- **Roster:** `RosterMatrix.tsx`
- **Shift:** `CurrentShiftDisplay.tsx`
- **Modals:** `NewLogModal.tsx`, `HandoverWizard.tsx`

### 3. Implementation
- For every hardcoded string:
    1.  Define a new key in `Translations` type in `languageStore.ts`.
    2.  Add the English text to `translations.en`.
    3.  Add the Turkish text to `translations.tr`.
    4.  Replace the hardcoded string in the component with `{t('new.key')}`.

## Success Criteria
- [ ] Application launches in Turkish for a new user (incognito/cleared storage).
- [ ] No visible English text in the main Dashboard, Operations, or Calendar views when language is set to TR.
- [ ] All "Success" criteria from other issues (like the Tab sorting) must also respect this localization rule.
