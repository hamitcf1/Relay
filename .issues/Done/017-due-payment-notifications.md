# Issue: Unpaid Sale Reminders Per Sale, In The Right Currency

## Description
The manager was told about unpaid sales by a single notification. It summed
`total_price - collected_amount` across every unpaid sale and the translation printed the result with
a euro sign hardcoded after it, so an 80 EUR tour and a 5000 TRY transfer produced
"2 satışta toplam 5080€ tahsil edilmedi". The `€` was not a formatting choice: the string was
`'{count} satışta toplam {amount}€ tahsil edilmedi.'` with `{amount}` substituted into the middle of
it. Nothing converted between currencies.

Two further problems sat behind it.

Repetition. A single `last_payment_check_{hotelId}` timestamp gated the whole thing on a four hour
interval, so the reminder either repeated the entire picture on a schedule or said nothing. A partial
payment never produced a new figure, because the timestamp had already fired. The complaint was that
it could keep notifying.

Nothing was ever reported, in practice. The dashboard subscribes to sales in an effect declared
*after* `useDuePaymentNotifier()`, so on the first render the sales list was still empty. The notifier
saw "no debt", and its own write-back then cleared the record. The separate demo defect below made it
worse: even when it did fire, the notification was destroyed a moment later.

## Proposed Changes
- Report one notification per sale, in the currency the sale was sold in, quoting the outstanding
  amount for that sale. Converting to a single currency instead would need the `currencyStore` rate
  table, which carries a 0.5% spread and falls back to approximate values offline, so a money figure
  in a reminder would be wrong by an amount nobody chose.
- Replace the timestamp gate with a per-sale fingerprint of the outstanding amount, kept in the
  existing `last_payment_check_{hotelId}` record. A sale is announced only when that figure changes,
  so a partial payment reports the new remaining amount and an untouched debt stays quiet. Records
  for sales that are no longer owed are dropped, so a settled sale that reopens is reported as new.
- Add `loaded` to `salesStore`. `loading === false` is also the state before anything has been
  subscribed, so "we have not looked yet" and "there is nothing here" were indistinguishable, and the
  notifier acted on the second when it meant the first.
- Link each reminder to the sale it is about (`/operations?tab=sales&sale=ID`) and read that param in
  `SalesPanel`. `SalesDetailModal` looks the id up in the store and renders nothing until the
  subscription delivers it, so holding the id is enough for the modal to appear on its own.
- Record a sale's fingerprint only after its notification write succeeds. `addNotification` rethrows,
  so recording first would mark a failed write as reported and the sale would stay silent for good.
- Give money owed its own `payment` notification type instead of borrowing the compliance alert's
  mark.
- Fix the demo notification seed. `subscribeToNotifications` replaced the whole array with two
  fixtures, which discarded anything added at runtime. The reminder writes on mount and the dropdown
  subscribes immediately after, so every demo login created the reminder and then threw it away while
  the "already reported" record said it was handled. The seed now merges and counts unread instead of
  pinning the count to 1.

## Success Criteria
- [x] `npx tsc -b` clean.
- [x] `npx eslint .` reports 0 errors.
- [x] `npm run test:rules` 60/60.
- [x] `npx playwright test` 264 passed, 0 failed, 38 skipped.
- [x] `npm run build` succeeds.
- [x] Mixed EUR/TRY/USD sales each produce their own reminder carrying their own amount and currency,
      and no reminder quotes a cross-currency sum.
- [x] An unchanged debt produces no second reminder, in the same session or a new one.
- [x] A partial payment produces a new reminder with the remaining figure.
- [x] A settled sale's record is dropped, and the same debt is reported again if it reopens.
- [x] Following a reminder's link opens that sale, and closing the sale clears the id from the URL.

## Notes
`getDueSales` had no age filter, so an unpaid sale from months ago is still reported. That is
deliberate for now: a debt that old is worth seeing, and the fingerprint is what keeps it from
becoming noise. If it does become noise, the filter belongs here rather than in the caller.

`last_payment_check_` is in `HOTEL_SCOPED_STORAGE_PREFIXES`, so signing out clears the record and the
next session re-announces the current debts. Re-entering the *demo* by navigating does not clear it,
which is why the cross-session case is tested through a fresh page load rather than a sign out.

The fixture notification ids were renamed from `note-1` / `note-2` to `demo-fixture-welcome` /
`demo-fixture-housekeeping`. Nothing referenced them, and the store now has to tell fixtures from
runtime additions by id, which reads badly against a generic name that also appears in `notesStore`.

`UserSettings.notifications` (`src/types/index.ts`) is a designed "notifications on" preference that
has never been read by anything. It is the natural home for a desktop notification opt-in, and is
still unused.
