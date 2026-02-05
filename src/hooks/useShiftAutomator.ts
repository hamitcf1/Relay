import { useEffect, useRef } from 'react'
import { format, isWithinInterval } from 'date-fns'
import { useRosterStore } from '@/stores/rosterStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useNotificationStore } from '@/stores/notificationStore'
import type { ShiftType } from '@/types'

const SHIFT_TIMES = {
    'A': { start: '08:00', end: '16:00' },
    'B': { start: '16:00', end: '00:00' },
    'C': { start: '00:00', end: '08:00' },
    'E': { start: '10:00', end: '18:00' },
}

export function useShiftAutomator(hotelId: string | null) {
    const { getShiftsForDate } = useRosterStore()
    const { currentShift, startShift, endShift, getLastClosedShift } = useShiftStore()
    const lastCheckRef = useRef<string | null>(null)
    const lastComplianceNotificationRef = useRef<number>(0)

    useEffect(() => {
        if (!hotelId) return

        const checkShift = async () => {
            const now = new Date()
            const timeStr = format(now, 'HH:mm')
            const dateStr = format(now, 'yyyy-MM-dd')

            // Prevent multiple checks within the same minute
            if (lastCheckRef.current === timeStr) return
            lastCheckRef.current = timeStr

            // 1. Check if we need to AUTO-END the current shift
            if (currentShift) {
                const config = SHIFT_TIMES[currentShift.type as keyof typeof SHIFT_TIMES]
                if (config) {
                    const [endH, endM] = config.end.split(':').map(Number)
                    const end = new Date(now)
                    end.setHours(endH, endM, 0, 0)

                    // If end time is 00:00, it actually means the start of the next day
                    if (config.end === '00:00') {
                        end.setDate(end.getDate() + 1)
                    }

                    // If current time is past the end time of the active shift, close it
                    if (now >= end) {
                        console.log(`[Automator] Shift ${currentShift.type} ended at ${config.end}. Auto-closing...`)
                        await endShift(hotelId, currentShift.cash_start, 'Automatically closed by system roster.')
                        return 
                    }
                }
            }

            // 2. Check if we need to AUTO-START a shift
            if (!currentShift) {
                const todayShifts = getShiftsForDate(now)

                for (const shiftInfo of todayShifts) {
                    const config = SHIFT_TIMES[shiftInfo.shift as keyof typeof SHIFT_TIMES]
                    if (!config) continue

                    const [startH, startM] = config.start.split(':').map(Number)
                    const [endH, endM] = config.end.split(':').map(Number)

                    const startTime = new Date(now)
                    startTime.setHours(startH, startM, 0, 0)

                    let endTime = new Date(now)
                    endTime.setHours(endH, endM, 0, 0)

                    // If end time is 00:00, it's the start of the next day
                    if (config.end === '00:00') {
                        endTime.setDate(endTime.getDate() + 1)
                    }

                    if (isWithinInterval(now, { start: startTime, end: endTime })) {
                        console.log(`[Automator] Time for Shift ${shiftInfo.shift} (${config.start}-${config.end}). Auto-starting...`)

                        // Get all staff for this shift
                        const staffIds = todayShifts
                            .filter(s => s.shift === shiftInfo.shift)
                            .map(s => s.uid)

                        // Attempt to carry over cash from last closed shift
                        const lastShift = await getLastClosedShift(hotelId)
                        const carryCash = lastShift?.cash_end || 0

                        await startShift(hotelId, staffIds, shiftInfo.shift as ShiftType, carryCash, dateStr)
                        break
                    }
                }
            }

            // 3. Compliance Notification (Every 2 hours)
            if (currentShift && (!currentShift.compliance.kbs_checked || currentShift.compliance.agency_msg_checked_count === 0)) {
                const twoHoursMs = 2 * 60 * 60 * 1000
                const nowMs = now.getTime()

                if (nowMs - lastComplianceNotificationRef.current > twoHoursMs) {
                    const { addNotification } = useNotificationStore.getState()
                    await addNotification(hotelId, {
                        type: 'compliance',
                        title: 'Compliance Checklist Pending',
                        content: `Shift ${currentShift.type} compliance tasks (KBS/Agency) are still pending. Please complete them.`,
                        target_role: 'receptionist',
                        link: '/'
                    })
                    lastComplianceNotificationRef.current = nowMs
                }
            }
        }

        const timer = setInterval(checkShift, 30000) // Check every 30 seconds
        checkShift() // Initial check

        return () => clearInterval(timer)
    }, [hotelId, currentShift, getShiftsForDate, startShift, endShift, getLastClosedShift])
}
