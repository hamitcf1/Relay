import { useEffect } from 'react'
import { useSalesStore, filterDueSales } from '@/stores/salesStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { Sale } from '@/types'

/**
 * Tells the manager about sales that are not paid in full.
 *
 * One notification per sale, in that sale's own currency.
 *
 * The previous version summed `total_price - collected_amount` across every unpaid sale and
 * printed the result with a euro sign hardcoded after it. With one sale at 80 EUR and another at
 * 5000 TRY that reported "5080 EUR owed", which is not a number anyone can act on. Converting to
 * a single currency instead would need the rate table in currencyStore, which carries a 0.5%
 * spread and silently falls back to approximate values offline, so a money figure in a reminder
 * would be wrong by an amount nobody chose. Stating each debt in the currency it was sold in is
 * both the honest number and the one the user needs to go and collect it.
 *
 * The other half of the complaint was repetition. A single timestamp gate meant every check either
 * told them about all of their debt or none of it, and the interval fired hourly, so an unchanged
 * debt nagged on a schedule. Each sale is now fingerprinted by how much is outstanding, and only a
 * sale whose amount has actually changed is announced again. Partial payment therefore reports the
 * new remaining figure, which is the case a manager most needs to see, and an untouched debt stays
 * quiet.
 */
export function useDuePaymentNotifier() {
    // Watching `sales` and `loaded` rather than calling getDueSales() on a timer is deliberate. The
    // dashboard subscribes to sales in an effect declared after this hook, so on the very first
    // render the store is still empty and `loaded` is false. An empty list then means "not looked
    // yet", not "nothing owed", and treating it as the latter would wipe the record of what has
    // already been reported and then re-announce every debt on the next run.
    const { sales, loaded } = useSalesStore()
    const { addNotification } = useNotificationStore()
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()

    useEffect(() => {
        const hotelId = hotel?.id
        if (!hotelId || !user || user.role !== 'gm') return

        // Safety check: Ensure the loaded hotel matches the user's assigned hotel
        // This prevents data leaks if the hotel store hasn't been cleared yet
        if (user.hotel_id && user.hotel_id !== hotelId) return

        // Nothing is known about the sales yet, so there is nothing to say about what is owed.
        if (!loaded) return

        const reportDuePayments = async () => {
            const storageKey = `last_payment_check_${hotelId}`

            const dueSales = filterDueSales(sales)

            let reported: Record<string, string> = {}
            try {
                reported = JSON.parse(localStorage.getItem(storageKey) || '{}')
                if (!reported || typeof reported !== 'object') reported = {}
            } catch {
                reported = {}
            }

            const { t } = useLanguageStore.getState()
            const owedIds = new Set(dueSales.map((sale) => sale.id))
            const next = { ...reported }

            for (const sale of dueSales) {
                const outstanding = Math.max(0, sale.total_price - sale.collected_amount)
                const fingerprint = `${outstanding} ${sale.currency}`

                if (reported[sale.id] === fingerprint) continue

                try {
                    await addNotification(hotelId, {
                        type: 'payment',
                        title: t('notifications.duePayments.title'),
                        content: describeSale(t, sale, outstanding),
                        // Straight to the sale, so the reminder can be settled without hunting for it.
                        link: `/operations?tab=sales&sale=${sale.id}`
                    })
                } catch (error) {
                    // addNotification rethrows. Leave this sale's fingerprint untouched so the next
                    // run tries again, and stop the run here: the notifications are independent, so
                    // the sales after this one are still worth reporting, but they are not worth
                    // reporting from inside a loop that is already failing.
                    console.error('Due payment notification failed:', error)
                    break
                }

                // Recorded only after the write succeeded. Recording it first would mean a failed
                // write leaves a sale marked as already reported, and it would then stay silent for
                // good.
                next[sale.id] = fingerprint
            }

            // Forget sales that are no longer owed. Without this the record only ever grows, and a
            // sale that is settled and then re-opened would be silenced by its stale fingerprint.
            for (const id of Object.keys(next)) {
                if (!owedIds.has(id)) delete next[id]
            }
            localStorage.setItem(storageKey, JSON.stringify(next))
        }

        reportDuePayments()
        // The check is a read of in-memory state, so this is only an upper bound on how quickly a
        // payment taken in another tab is noticed. The effect re-runs on its own whenever `sales`
        // changes, so the interval is a backstop rather than the main path.
        const intervalId = setInterval(reportDuePayments, 60 * 60 * 1000)

        return () => clearInterval(intervalId)
    }, [sales, loaded, hotel?.id, user, addNotification])
}

/** The translate function the language store exposes, taken from it so the two cannot drift. */
type Translate = ReturnType<typeof useLanguageStore.getState>['t']

/** "Cappadocia tour · Guest Ayşe Yılmaz, room 101 · 80 EUR outstanding" */
function describeSale(t: Translate, sale: Sale, outstanding: number) {
    const who = [sale.customer_name, sale.room_number && t('notifications.duePayments.room', { room: sale.room_number })]
        .filter(Boolean)
        .join(', ')

    const amount = t('notifications.duePayments.amount', {
        amount: formatAmount(outstanding),
        currency: sale.currency
    })

    return who
        ? `${sale.name} · ${who} · ${amount}`
        : `${sale.name} · ${amount}`
}

/**
 * Thousands separated, without a trailing fraction that is only noise.
 *
 * The stored amount is what the manager owes or expects, so it is shown at full precision rather
 * than rounded: rounding 80.50 to "80" would understate the debt.
 */
function formatAmount(amount: number) {
    const isWhole = Number.isInteger(amount)
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: isWhole ? 0 : 2,
        maximumFractionDigits: 2
    }).format(amount)
}
