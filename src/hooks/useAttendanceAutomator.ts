import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAttendanceStore } from '@/stores/attendanceStore'

const RECONCILE_INTERVAL_MS = 30_000

export function useAttendanceAutomator(hotelId: string | null) {
    const user = useAuthStore((state) => state.user)
    const records = useAttendanceStore((state) => state.records)
    const autoClockOut = useAttendanceStore((state) => state.autoClockOut)
    const inFlight = useRef(new Set<string>())

    useEffect(() => {
        if (!hotelId || !user || (user.role !== 'gm' && user.role !== 'receptionist')) return

        const reconcile = () => {
            const now = new Date()
            records.forEach((record) => {
                const canReconcile = user.role === 'gm' || record.staff_id === user.uid
                if (!canReconcile || record.status !== 'clocked_in' || now < record.scheduled_end || inFlight.current.has(record.id)) return

                inFlight.current.add(record.id)
                void autoClockOut(hotelId, user, record)
                    .catch((error) => console.error('Automatic attendance clock-out failed:', error))
                    .finally(() => inFlight.current.delete(record.id))
            })
        }

        reconcile()
        const timer = window.setInterval(reconcile, RECONCILE_INTERVAL_MS)
        return () => window.clearInterval(timer)
    }, [autoClockOut, hotelId, records, user])
}
