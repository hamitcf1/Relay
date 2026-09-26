# Issue: enterDemo Dismissed the Announcement by Probe, Not by Wait

## Description
`enterDemo` in `tests/e2e/helpers.ts` checked the announcement dialog with a single
`isVisible()` call. The dialog renders once the announcement store has hydrated, and under parallel
Playwright load that lands after the dashboard does. A probe taken that early reads "not there",
skips the dismissal, and the dialog then opens on top of the onboarding wizard. The helper's next
step waits on the wizard's close button, which is now covered, and the test fails with a timeout
naming the wizard.

The failure is misleading in two ways: it blames the wizard, and it is load dependent. It passed
when the suite ran on one worker and failed on two, which is the signature of a race rather than a
regression. It reproduced on unmodified `main`.

## Proposed Changes
- Wait for the dialog rather than probing for it.
- Only wait for the Receptionist persona. Both demo announcements were written by the manager, and
  `nextUnreadAnnouncement` skips anything the viewer authored, so the manager can never see this
  dialog. Waiting unconditionally would add a fixed delay to every scenario with nothing to dismiss.
- Keep the `keepAnnouncement` early return, which means "stop here, I will dismiss it myself" and
  also skips the wizard cleanup.

## Success Criteria
- [x] `tests/e2e/announcement-store-writes.spec.ts` and `tests/e2e/announcement-recall.spec.ts`
      pass on both projects with the default worker count, repeatedly.
- [x] `npm run test:e2e` 252 passed, 0 failed, 38 skipped.

## Related Files
- `tests/e2e/helpers.ts`
- `src/components/messaging/AnnouncementModal.tsx`
- `src/lib/announcements.ts`
