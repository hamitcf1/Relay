import { addDays, format, parseISO } from 'date-fns'
import type { HotelSettings, ShiftType } from '@/types'

export interface AttendanceAssignment {
    workDate: string
    shiftType: ShiftType
    scheduledStart: Date
    scheduledEnd: Date
}

const DEFAULT_SHIFT_TIMES: Record<ShiftType, { startTime: string; endTime: string }> = {
    A: { startTime: '08:00', endTime: '16:00' },
    B: { startTime: '16:00', endTime: '00:00' },
    C: { startTime: '00:00', endTime: '08:00' },
    E: { startTime: '09:00', endTime: '18:00' },
}

function atLocalTime(date: Date, time: string) {
    const [hours = 0, minutes = 0] = time.split(':').map(Number)
    const result = new Date(date)
    result.setHours(hours, minutes, 0, 0)
    return result
}

export function getShiftTimes(shiftType: ShiftType, settings?: HotelSettings) {
    const configured = settings?.shifts?.find((shift) => shift.code === shiftType)
    return {
        startTime: configured?.startTime || DEFAULT_SHIFT_TIMES[shiftType].startTime,
        endTime: configured?.endTime || DEFAULT_SHIFT_TIMES[shiftType].endTime,
    }
}

export function getScheduledWindow(workDate: string, shiftType: ShiftType, settings?: HotelSettings) {
    const baseDate = parseISO(workDate)
    const { startTime, endTime } = getShiftTimes(shiftType, settings)
    const scheduledStart = atLocalTime(baseDate, startTime)
    let scheduledEnd = atLocalTime(baseDate, endTime)

    if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
        scheduledEnd = addDays(scheduledEnd, 1)
    }

    return { scheduledStart, scheduledEnd }
}

export function findRelevantAssignment(
    now: Date,
    userSchedule: Record<string, ShiftType | 'OFF'> | undefined,
    fallbackShift: ShiftType | null,
    settings?: HotelSettings,
): AttendanceAssignment | null {
    const today = format(now, 'yyyy-MM-dd')
    const yesterday = format(addDays(now, -1), 'yyyy-MM-dd')
    const candidates: AttendanceAssignment[] = []

    for (const workDate of [today, yesterday]) {
        const rosterShift = userSchedule?.[workDate]
        const shiftType = rosterShift && rosterShift !== 'OFF'
            ? rosterShift
            : workDate === today ? fallbackShift : null

        if (!shiftType) continue
        const window = getScheduledWindow(workDate, shiftType, settings)
        candidates.push({ workDate, shiftType, ...window })
    }

    const nearby = candidates
        .filter(({ scheduledStart, scheduledEnd }) => (
            now.getTime() >= scheduledStart.getTime() - 60 * 60_000
            && now.getTime() <= scheduledEnd.getTime() + 4 * 60 * 60_000
        ))
        .sort((a, b) => Math.abs(now.getTime() - a.scheduledStart.getTime()) - Math.abs(now.getTime() - b.scheduledStart.getTime()))

    return nearby[0] || candidates.find((candidate) => candidate.workDate === today) || null
}

export function minutesLate(actual: Date, scheduled: Date) {
    return Math.max(0, Math.ceil((actual.getTime() - scheduled.getTime()) / 60_000))
}
