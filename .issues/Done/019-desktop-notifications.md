# Issue: Desktop Notifications

## Description
Notifications only existed inside the app. A manager working in another window, or on another
monitor, or on the phone with the laptop lid closed, had no way to find out that something had come
in except by coming back and looking. The ask was for the machine that is open to be told.

The browser can raise a notification on the machine it is running on, but it will not do so without
being asked, and it will not say yes without a person asking it. So this is three separate pieces:
a way to ask, a place to record the answer, and a decision about what is worth announcing.

## Proposed Changes
- `src/lib/desktopNotifications.ts`. A thin wrapper over the browser's own `Notification`. Detects
  the API being absent, which is what an old engine or a page served over plain http looks like,
  and wraps the constructor because some builds throw when the page is not considered active or
  when too many notifications are already queued. Neither is worth breaking the caller over, since
  the in-app notification has already been recorded by then.
- `desktop_notifications` on `UserSettings`, rather than `localStorage`. The preference belongs to
  the account, so it follows the person to another machine instead of having to be set again on
  every device.
- `src/hooks/useDesktopNotifications.ts`, mounted in `ProtectedDashboardShell`.
- The switch lives in `AppearanceOptions`, which is the personal preferences panel, reachable from
  the avatar menu on both layouts and available to every role. The `settings` module is not: it is
  hotel-wide and GM-only, and this is nobody else's business.
- A denial is reported next to the switch, with how to undo it in the browser's own settings. The
  preference and the permission are kept apart, because the browser can withdraw the second without
  the account hearing about it.
- A `payment` notification uses `requireInteraction`, so money owed stays on screen until it is
  dealt with. Everything else is a glance.
- `src/components/ui/Toggle.tsx`, extracted from the private copy in `AppearanceOptions` so a
  second setting does not mean a second implementation.
- `tests/e2e/desktop-notifications.spec.ts`, and a QA section in `docs/qa/TEST_CASES.md`.

## Success Criteria
- [x] `npx tsc -b` clean.
- [x] `npx eslint .` reports 0 errors, 18 pre-existing warnings.
- [x] `npm run test:rules` 60/60.
- [x] `npx playwright test` 300 passed, 0 failed, 38 skipped.
- [x] `npm run build` succeeds.
- [x] Opening the app with the preference already on raises nothing for what was already in the list.
- [x] A notification that arrives while the app is open is raised once.
- [x] A refused permission leaves the switch off and says why.
- [x] A browser with no notification support is said so, and the switch is disabled.
- [x] Turning this off stops it, at both viewport sizes.

## Notes
**What this does not do.** Nothing arrives when the tab is closed. That needs a push service, a
server holding VAPID keys and a service worker, and it is a different piece of work rather than a
bigger version of this one. Everything above happens inside a tab that is open, which is what was
asked for.

**The decision that carries the risk is what counts as new.** The list arrives from a subscription,
so the first delivery after mounting already holds everything that accumulated since the last visit.
Announcing that would fire a burst of toasts at someone who had only opened the app, which is the
fastest way to get this switched off and left off. So the first delivery is recorded as a baseline
and nothing is raised from it, and only what turns up afterwards is announced.

**That baseline needs the store to be able to say "nothing has arrived yet".** It could not, and the
empty list is not the same thing. `loading` is also false before a subscription exists, so a hook
mounted alongside the subscriber would read an empty list as the real one. `notificationStore` now
carries a `loaded` flag, the same distinction `salesStore` already makes and for the same reason. A
failed subscription deliberately leaves it false: an empty list that failed to load is not
knowledge, and reporting it as loaded would let the baseline be taken from nothing.

The regression test for that is not decorative. Leaving the shell and coming back gives the hook a
fresh tally, and emptying the store while it is gone makes the remount begin in the state a page
load begins in. The assertion that nothing is raised for the first batch fails if the `loaded` check
is removed, which was verified by removing it and running the suite.

**The switch does not store the preference over a refusal.** It only writes once the browser has
agreed. A switch reading "on" while the browser refuses every notification is worse than an honest
off, because nothing would ever arrive and there would be no sign of why. For the same reason a
denial is described even while the preference is off, which is the state a refused click leaves
behind: true, and silent about the click that did nothing.

**The permission is asked for from the switch** because that is the only place a person is
guaranteed to be present. Asking when the first notification arrives would be refused, and asking on
a timer is the behaviour users already dislike most.

**`Toggle` keeps `aria-pressed`** rather than moving to `role="switch"`. The navigation editor, the
theme picker and the accent picker all use it, and two of them are asserted that way in tests.
Changing the semantics of one control in a preference panel that already has a convention would be
a larger, unrequested change.

**No icon is passed to the notification.** The only brand assets in `public/` are a 1.5MB board
image and an SVG, and Windows toasts do not render SVG reliably, so the platform default is a better
outcome than a path that resolves to nothing.

## Related Files
- `src/lib/desktopNotifications.ts`
- `src/hooks/useDesktopNotifications.ts`
- `src/components/settings/DesktopNotificationSetting.tsx`
- `src/components/ui/Toggle.tsx`
- `src/components/settings/AppearanceOptions.tsx`
- `src/stores/notificationStore.ts`
- `src/types/index.ts`
- `src/App.tsx`
- `tests/e2e/desktop-notifications.spec.ts`
