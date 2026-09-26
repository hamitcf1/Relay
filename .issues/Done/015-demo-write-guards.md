# Issue: Live Demo Write Guards

## Description
The live demo signs in through `loginAsDemo`, which sets `hotelId = 'demo-hotel-id'` and a local
user object without ever creating a Firebase session. Every write to Firestore for that hotel is
therefore rejected with `permission-denied`. Stores are expected to notice the demo and mutate their
own in-memory copy instead.

Those checks had drifted. `roomStore` had ten write actions and none of them, `pricingStore` and
`salesStore` had none at all, and `src/lib/calendar-sync.ts` had never had any. In the demo that
surfaced as rejected promises, uncaught errors, and toasts saying a save had failed while the UI
showed nothing. Two paths were quietly doing nothing: note-to-calendar sync, and the sale-to-shift-note
sync that raises "Satış kaydedildi ancak nöbet notu güncellenemedi".

## Proposed Changes
- Add a demo branch to every reachable Firestore write in `src/stores`, mutating local state instead
  of writing. The Firestore path is left byte-for-byte equivalent.
- Add demo branches to all three functions in `src/lib/calendar-sync.ts` and to the module-level
  `syncLinkedNotes` in `salesStore.ts`, which is a plain function rather than a store action.
- Give `calendarStore.addEvent` an optional explicit id and make it resolve to the new id, so a
  linked event can be found again later. `syncNoteToCalendar` needs a predictable id because
  `removeNoteFromCalendar` has to take the event back out when the note is resolved.
- Skip the `activity_logs` / `sessions` write in `ActivityTracker` and the `users/{uid}` write in
  `StaffManagement.handleToggleStatus` for a demo session.
- Add `scripts/scan-demo-writes.mjs`, which reports reachable Firestore writes with no demo check,
  and run it as a test so a new store action cannot silently regress.
- Add `tests/e2e/demo-write-guards.spec.ts`, which drives the real stores in the browser and asserts
  local state actually changed. A guard that returns without mutating would pass a "did not throw"
  check while leaving the demo looking broken.

## Success Criteria
- [x] `npx tsc -b` clean.
- [x] `npx eslint .` reports 0 errors.
- [x] `npm run test:rules` 60/60.
- [x] `npm run test:e2e` 252 passed, 0 failed, 38 skipped.
- [x] `npm run build` succeeds.
- [x] `npm run test:demo-writes` reports no unguarded write outside the documented exemption list.
- [x] Every demo path asserts the local state changed, not merely that nothing threw.

## Notes
The scan is name-based for both "is it guarded" and "can it be called", which is a real limitation:
two stores can define the same action name, and a caller reached through a spread or a computed
lookup is invisible to it. It is a backstop against the obvious regression, not a proof.

Exemptions, each with a reason in `tests/e2e/demo-write-guards.spec.ts`:
`hotelStore.joinHotelByCode` / `validateHotelCode` / `createNewHotel` are real onboarding,
`incidentStore.addIncident` is only reachable from a modal nothing renders, and `LoginPage` /
`RegisterPage` are the real auth pages.

## Related Files
- `scripts/scan-demo-writes.mjs`
- `tests/e2e/demo-write-guards.spec.ts`
- `src/lib/calendar-sync.ts`
- `src/stores/salesStore.ts`
- `src/stores/roomStore.ts`
- `src/stores/calendarStore.ts`
- `src/stores/pricingStore.ts`
- `src/stores/notesStore.ts`
- `src/components/tracking/ActivityTracker.tsx`
- `src/components/settings/StaffManagement.tsx`
