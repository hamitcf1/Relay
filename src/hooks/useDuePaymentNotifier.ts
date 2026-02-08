import { useEffect } from 'react'
import { useSalesStore } from '@/stores/salesStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'

/**
 * Hook that checks for outstanding payments and triggers notifications.
 * Runs on dashboard load and every 2 hours thereafter.
 */
export function useDuePaymentNotifier() {
    const { getDueSales } = useSalesStore()
    const { addNotification } = useNotificationStore()
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()

    useEffect(() => {
        if (!hotel?.id || !user || user.role !== 'gm') return

        const checkDuePayments = async () => {
            const now = Date.now()
            const STORAGE_KEY = `last_payment_check_${hotel.id}`
            const lastCheckTime = parseInt(localStorage.getItem(STORAGE_KEY) || '0')

            // Check every 4 hours instead of 2, and persist across reloads
            const CHECK_INTERVAL = 4 * 60 * 60 * 1000

            if (now - lastCheckTime < CHECK_INTERVAL) return

            // Update last check time IMMEDIATELY before the async call
            // This prevents race conditions if the hook is re-triggered
            localStorage.setItem(STORAGE_KEY, now.toString())

            const dueSales = getDueSales()
            if (dueSales.length === 0) return

            // Calculate total outstanding amount
            const totalDue = dueSales.reduce((sum, sale) => {
                return sum + (sale.total_price - sale.collected_amount)
            }, 0)

            // Create a summary notification
            await addNotification(hotel.id, {
                type: 'compliance',
                title: 'Bekleyen Ödemeler',
                content: `${dueSales.length} satışta toplam ${totalDue}€ tahsil edilmedi.`
            })
        }

        // Run immediately on mount (checks storage)
        checkDuePayments()

        // Set up interval for periodic checks
        const intervalId = setInterval(checkDuePayments, 60 * 60 * 1000) // Check every hour if we need to trigger

        return () => clearInterval(intervalId)
    }, [hotel?.id, user, addNotification])
}
