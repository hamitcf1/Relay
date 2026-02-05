import { useEffect, useRef } from 'react'
import { useSalesStore } from '@/stores/salesStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'

/**
 * Hook that checks for outstanding payments and triggers notifications.
 * Runs on dashboard load and every 2 hours thereafter.
 */
export function useDuePaymentNotifier() {
    const { sales, getDueSales } = useSalesStore()
    const { addNotification } = useNotificationStore()
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()
    const lastCheckRef = useRef<number>(0)

    useEffect(() => {
        if (!hotel?.id || !user || user.role !== 'gm') return

        const checkDuePayments = async () => {
            const now = Date.now()
            // Only run if at least 2 hours have passed since last check
            const TWO_HOURS = 2 * 60 * 60 * 1000
            if (now - lastCheckRef.current < TWO_HOURS) return

            lastCheckRef.current = now

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

            // Create individual notifications for high-value outstanding amounts
            for (const sale of dueSales) {
                const remaining = sale.total_price - sale.collected_amount
                if (remaining >= 50) { // Only notify for amounts >= 50€
                    await addNotification(hotel.id, {
                        type: 'compliance',
                        title: `Oda ${sale.room_number}: Kalan Ödeme`,
                        content: `${sale.name} - ${remaining}€ tahsil edilmedi`
                    })
                }
            }
        }

        // Run immediately on mount
        checkDuePayments()

        // Set up interval for periodic checks (every 2 hours)
        const intervalId = setInterval(checkDuePayments, 2 * 60 * 60 * 1000)

        return () => clearInterval(intervalId)
    }, [hotel?.id, user, sales, getDueSales, addNotification])
}
