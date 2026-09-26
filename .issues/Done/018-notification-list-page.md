# Issue: Notification List Page

## Description
The badge dropdown was the only view of notifications. It capped its scroll at 400px and laid
everything out as one flat run, so a manager partway through a shift could not tell a payment
reminder from a housekeeping message without reading down the stack. Its "view all" footer linked to
`/operations?tab=activity`, which renders `activity_logs` and has never contained a notification.

Two smaller things were in the same area:

- The "clear all" confirmation button was labelled with `common.clear`, which is the chat's
  "Sohbeti Temizle" in Turkish. A dialog about deleting notifications offered "Clear Chat".
- The badge's `aria-label` interpolated a hardcoded English `unread`, so it read
  "Bildirimler (3 unread)" in Turkish.

## Proposed Changes
- Add `/notifications`, reached from the badge footer, replacing the link to the activity log.
- Group by day, cut on local midnight rather than a rolling 24 hours, so a reminder from last
  evening stays under "yesterday" whenever it is read.
- Show an exact timestamp on the page instead of "3 hours ago". The dropdown cannot: a full
  timestamp would either reflow as the relative text changes width or sit at an unpredictable
  distance from the title. It is a `<time datetime>` either way.
- Extract the row and the icon and colour maps into shared components. The two screens had written
  them out separately, which is how adding the `payment` type came to mean editing two maps with
  nothing to say if only one had been updated. The maps are typed as complete records so a new
  `NotificationType` fails to compile until it has an entry.
- Subscribe from the page rather than inheriting the dashboard's. Arriving at the URL directly never
  mounts `DashboardPage`, and nothing would otherwise be listening. The hotel id comes from the
  account; the page renders nothing about the hotel, so reading the hotel document on every visit
  would be a round trip bought for nothing.
- Give the mark-all-read button an `aria-label`. Its visible label is hidden below the `sm`
  breakpoint and its icon is `aria-hidden`, so on a phone the control had no accessible name at all.
- `tests/e2e/notification-list-page.spec.ts`, and a QA section in `docs/qa/TEST_CASES.md`.

## Success Criteria
- [x] `npx tsc -b` clean.
- [x] `npx eslint .` reports 0 errors.
- [x] `npm run test:rules` 60/60.
- [x] `npx playwright test` 280 passed, 0 failed, 38 skipped.
- [x] `npm run build` succeeds.
- [x] The badge footer reaches `/notifications` and not `/operations?tab=activity`.
- [x] Notifications group by day, newest day first, and 20 hours apart can share a bucket.
- [x] Opening one marks it read and follows its link; dismissing one leaves the others.
- [x] Mark all read clears the badge and removes nothing; clear all empties the list.
- [x] Every control on the page has an accessible name, at both viewport sizes.

## Notes
This is a route, not a workspace module. A module takes a sidebar slot and a position in the
navigation config, and this is somewhere you arrive at from a reminder rather than a place you
browse to, so spending one of those on it would be a poor trade.

The day grouping reads `t` from the language store inside the `useMemo` rather than through
`getState()`, so switching language relabels the headers instead of leaving them stale.

Every test reaches this page by clicking through the badge. `page.goto` is a full page load, and the
demo session lives in memory, so navigating that way signs the manager out mid-test. That is also the
route a user takes, which is why it is the one under test.

Seeding the notification store in a test is only safe once the page's own subscription has landed.
The URL changes before React mounts the page, and the demo seed merges rather than replaces, so a
test that seeds first has the two fixtures merged back on top and counts that have nothing to do
with the code under test. The helper waits for the fixture by id instead of sleeping.

The demo seed's merge is load-bearing for the tests as well as for the reminder: it is what lets a
test put a known list in place and keep it there.

The dropdown's `onSelect` still calls `preventDefault`, so the menu stays open after a click. That
was deliberate before, to read as "go there" rather than "dismiss and stay", and the destination is
a full screen now either way. Left alone rather than changed for its own sake.
