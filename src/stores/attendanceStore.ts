import { create } from 'zustand'
import {
    Timestamp,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    where,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { minutesLate, type AttendanceAssignment } from '@/lib/attendance'
import type { AttendanceRecord, User } from '@/types'
import { useActivityStore } from './activityStore'
import { useLanguageStore } from './languageStore'

interface AttendanceState {
    records: AttendanceRecord[]
    loading: boolean
    error: string | null
    subscribeToAttendance: (hotelId: string, staffId?: string) => () => void
    clockIn: (hotelId: string, user: User, assignment: AttendanceAssignment, excuse?: string, managerPermission?: boolean) => Promise<void>
    clockOut: (hotelId: string, user: User, recordId: string) => Promise<void>
    reviewLateArrival: (hotelId: string, gm: User, recordId: string, decision: 'approved' | 'rejected', note?: string) => Promise<void>
}

function toDate(value: unknown): Date {
    if (value instanceof Timestamp) return value.toDate()
    if (value instanceof Date) return value
    return new Date(value as string | number)
}

function mapRecord(id: string, data: Record<string, unknown>): AttendanceRecord {
    return {
        id,
        hotel_id: String(data.hotel_id || ''),
        staff_id: String(data.staff_id || ''),
        staff_name: String(data.staff_name || ''),
        staff_role: data.staff_role as AttendanceRecord['staff_role'],
        work_date: String(data.work_date || ''),
        shift_type: data.shift_type as AttendanceRecord['shift_type'],
        scheduled_start: toDate(data.scheduled_start),
        scheduled_end: toDate(data.scheduled_end),
        clock_in_at: toDate(data.clock_in_at),
        clock_out_at: data.clock_out_at ? toDate(data.clock_out_at) : null,
        status: data.status as AttendanceRecord['status'],
        late_minutes: Number(data.late_minutes || 0),
        late_excuse: data.late_excuse ? String(data.late_excuse) : null,
        manager_permission_declared: typeof data.manager_permission_declared === 'boolean' ? data.manager_permission_declared : null,
        approval_status: (data.approval_status as AttendanceRecord['approval_status']) || (Number(data.late_minutes || 0) > 0 ? 'pending' : 'not_required'),
        reviewed_by: data.reviewed_by ? String(data.reviewed_by) : null,
        reviewed_by_name: data.reviewed_by_name ? String(data.reviewed_by_name) : null,
        reviewed_at: data.reviewed_at ? toDate(data.reviewed_at) : null,
        review_note: data.review_note ? String(data.review_note) : null,
        worked_minutes: data.worked_minutes == null ? null : Number(data.worked_minutes),
    }
}

function demoRecords(): AttendanceRecord[] {
    const now = new Date()
    const scheduledStart = new Date(now)
    scheduledStart.setHours(8, 0, 0, 0)
    const scheduledEnd = new Date(now)
    scheduledEnd.setHours(16, 0, 0, 0)
    const clockIn = new Date(scheduledStart.getTime() + 12 * 60_000)
    return [{
        id: 'demo-attendance',
        hotel_id: 'demo-hotel-id',
        staff_id: 'demo-user-staff',
        staff_name: 'Demo Staff',
        staff_role: 'receptionist',
        work_date: now.toLocaleDateString('sv-SE'),
        shift_type: 'A',
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        clock_in_at: clockIn,
        clock_out_at: null,
        status: 'clocked_in',
        late_minutes: 12,
        late_excuse: 'Toplu taşıma gecikmesi',
        manager_permission_declared: true,
        approval_status: 'pending',
        reviewed_by: null,
        reviewed_by_name: null,
        reviewed_at: null,
        review_note: null,
        worked_minutes: null,
    }]
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
    records: [],
    loading: true,
    error: null,

    subscribeToAttendance: (hotelId, staffId) => {
        set({ loading: true, error: null })
        if (hotelId === 'demo-hotel-id') {
            set({ records: demoRecords(), loading: false })
            return () => undefined
        }

        const attendanceRef = collection(db, 'hotels', hotelId, 'attendance')
        const attendanceQuery = staffId
            ? query(attendanceRef, where('staff_id', '==', staffId))
            : query(attendanceRef, orderBy('work_date', 'desc'), limit(500))
        return onSnapshot(attendanceQuery, (snapshot) => {
            set({
                records: snapshot.docs
                    .map((item) => mapRecord(item.id, item.data()))
                    .sort((a, b) => b.clock_in_at.getTime() - a.clock_in_at.getTime()),
                loading: false,
                error: null,
            })
        }, (error) => {
            console.error('Attendance subscription failed:', error)
            set({ loading: false, error: error.message })
        })
    },

    clockIn: async (hotelId, user, assignment, excuse = '', managerPermission) => {
        const t = useLanguageStore.getState().t
        const now = new Date()
        const lateMinutes = minutesLate(now, assignment.scheduledStart)
        const cleanExcuse = excuse.trim()
        if (lateMinutes > 0 && !cleanExcuse) {
            throw new Error('LATE_EXCUSE_REQUIRED')
        }
        if (lateMinutes > 0 && typeof managerPermission !== 'boolean') {
            throw new Error('MANAGER_PERMISSION_REQUIRED')
        }

        if (hotelId === 'demo-hotel-id') {
            const record: AttendanceRecord = {
                id: `${assignment.workDate}_${user.uid}_${assignment.shiftType}`,
                hotel_id: hotelId,
                staff_id: user.uid,
                staff_name: user.name,
                staff_role: user.role,
                work_date: assignment.workDate,
                shift_type: assignment.shiftType,
                scheduled_start: assignment.scheduledStart,
                scheduled_end: assignment.scheduledEnd,
                clock_in_at: now,
                clock_out_at: null,
                status: 'clocked_in',
                late_minutes: lateMinutes,
                late_excuse: cleanExcuse || null,
                manager_permission_declared: lateMinutes > 0 ? managerPermission ?? null : null,
                approval_status: lateMinutes > 0 ? 'pending' : 'not_required',
                reviewed_by: null,
                reviewed_by_name: null,
                reviewed_at: null,
                review_note: null,
                worked_minutes: null,
            }
            set({ records: [record, ...get().records.filter((item) => item.id !== record.id)] })
            toast.success(t('attendance.toast.clockIn'))
            return
        }

        const recordId = `${assignment.workDate}_${user.uid}_${assignment.shiftType}`
        const recordRef = doc(db, 'hotels', hotelId, 'attendance', recordId)
        const eventRef = doc(db, 'hotels', hotelId, 'attendance_events', `${recordId}_clock_in`)
        await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(recordRef)
            if (existing.exists()) throw new Error('ALREADY_CLOCKED_IN')
            transaction.set(recordRef, {
                hotel_id: hotelId,
                staff_id: user.uid,
                staff_name: user.name,
                staff_role: user.role,
                work_date: assignment.workDate,
                shift_type: assignment.shiftType,
                scheduled_start: Timestamp.fromDate(assignment.scheduledStart),
                scheduled_end: Timestamp.fromDate(assignment.scheduledEnd),
                clock_in_at: Timestamp.fromDate(now),
                clock_out_at: null,
                status: 'clocked_in',
                late_minutes: lateMinutes,
                late_excuse: cleanExcuse || null,
                manager_permission_declared: lateMinutes > 0 ? managerPermission : null,
                approval_status: lateMinutes > 0 ? 'pending' : 'not_required',
                reviewed_by: null,
                reviewed_by_name: null,
                reviewed_at: null,
                review_note: null,
                worked_minutes: null,
                created_at: Timestamp.fromDate(now),
                updated_at: Timestamp.fromDate(now),
            })
            transaction.set(eventRef, {
                record_id: recordId,
                staff_id: user.uid,
                staff_name: user.name,
                event: 'clock_in',
                occurred_at: Timestamp.fromDate(now),
                late_minutes: lateMinutes,
                excuse: cleanExcuse || null,
                manager_permission_declared: lateMinutes > 0 ? managerPermission : null,
            })
        })
        await useActivityStore.getState().logActivity(
            hotelId, user.uid, user.name, user.role, 'attendance_clock_in',
            `${t('attendance.report.shift', { type: assignment.shiftType })} · ${lateMinutes > 0 ? `${lateMinutes} ${t('attendance.unit.minute')} ${t('attendance.clock.late')} · ${cleanExcuse}` : t('attendance.report.onTime')}`,
        )
        toast.success(t('attendance.toast.clockIn'))
    },

    clockOut: async (hotelId, user, recordId) => {
        const t = useLanguageStore.getState().t
        const now = new Date()
        if (hotelId === 'demo-hotel-id') {
            set({ records: get().records.map((record) => record.id === recordId ? {
                ...record,
                clock_out_at: now,
                status: 'clocked_out',
                worked_minutes: Math.max(0, Math.floor((now.getTime() - record.clock_in_at.getTime()) / 60_000)),
            } : record) })
            toast.success(t('attendance.toast.clockOut'))
            return
        }

        const recordRef = doc(db, 'hotels', hotelId, 'attendance', recordId)
        const eventRef = doc(db, 'hotels', hotelId, 'attendance_events', `${recordId}_clock_out`)
        let workedMinutes = 0
        await runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(recordRef)
            if (!snapshot.exists()) throw new Error('ATTENDANCE_NOT_FOUND')
            const data = snapshot.data()
            if (data.staff_id !== user.uid) throw new Error('NOT_OWN_ATTENDANCE')
            if (data.status !== 'clocked_in') throw new Error('ALREADY_CLOCKED_OUT')
            const clockIn = toDate(data.clock_in_at)
            workedMinutes = Math.max(0, Math.floor((now.getTime() - clockIn.getTime()) / 60_000))
            transaction.update(recordRef, {
                clock_out_at: Timestamp.fromDate(now),
                status: 'clocked_out',
                worked_minutes: workedMinutes,
                updated_at: Timestamp.fromDate(now),
            })
            transaction.set(eventRef, {
                record_id: recordId,
                staff_id: user.uid,
                staff_name: user.name,
                event: 'clock_out',
                occurred_at: Timestamp.fromDate(now),
                worked_minutes: workedMinutes,
            })
        })
        await useActivityStore.getState().logActivity(
            hotelId, user.uid, user.name, user.role, 'attendance_clock_out',
            `${Math.floor(workedMinutes / 60)} ${t('attendance.unit.hour')} ${workedMinutes % 60} ${t('attendance.unit.minute')}`,
        )
        toast.success(t('attendance.toast.clockOut'))
    },

    reviewLateArrival: async (hotelId, gm, recordId, decision, note = '') => {
        const t = useLanguageStore.getState().t
        if (gm.role !== 'gm') throw new Error('GM_REQUIRED')
        const now = new Date()
        const cleanNote = note.trim()
        if (decision === 'rejected' && !cleanNote) throw new Error('REJECTION_NOTE_REQUIRED')

        if (hotelId === 'demo-hotel-id') {
            set({ records: get().records.map((record) => record.id === recordId ? {
                ...record,
                approval_status: decision,
                reviewed_by: gm.uid,
                reviewed_by_name: gm.name,
                reviewed_at: now,
                review_note: cleanNote || null,
            } : record) })
            toast.success(decision === 'approved' ? t('attendance.toast.approved') : t('attendance.toast.rejected'))
            return
        }

        const recordRef = doc(db, 'hotels', hotelId, 'attendance', recordId)
        const eventRef = doc(db, 'hotels', hotelId, 'attendance_events', `${recordId}_review_${now.getTime()}`)
        await runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(recordRef)
            if (!snapshot.exists()) throw new Error('ATTENDANCE_NOT_FOUND')
            if (Number(snapshot.data().late_minutes || 0) <= 0) throw new Error('REVIEW_NOT_REQUIRED')
            transaction.update(recordRef, {
                approval_status: decision,
                reviewed_by: gm.uid,
                reviewed_by_name: gm.name,
                reviewed_at: Timestamp.fromDate(now),
                review_note: cleanNote || null,
                updated_at: Timestamp.fromDate(now),
            })
            transaction.set(eventRef, {
                record_id: recordId,
                staff_id: snapshot.data().staff_id,
                staff_name: snapshot.data().staff_name,
                event: 'manager_review',
                decision,
                reviewed_by: gm.uid,
                reviewed_by_name: gm.name,
                review_note: cleanNote || null,
                occurred_at: Timestamp.fromDate(now),
            })
        })
        await useActivityStore.getState().logActivity(
            hotelId, gm.uid, gm.name, gm.role, 'attendance_review',
            `${decision === 'approved' ? t('attendance.report.approved') : t('attendance.report.rejected')} · ${cleanNote || '—'}`,
        )
        toast.success(decision === 'approved' ? t('attendance.toast.approved') : t('attendance.toast.rejected'))
    },
}))
