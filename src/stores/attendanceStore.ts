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
    serverTimestamp,
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
    clockIn: (hotelId: string, user: User, assignment: AttendanceAssignment, declaredAt: Date, excuse?: string, managerPermission?: boolean) => Promise<void>
    clockOut: (hotelId: string, user: User, recordId: string, declaredAt: Date) => Promise<void>
    autoClockOut: (hotelId: string, actor: User, record: AttendanceRecord) => Promise<void>
    reviewLateArrival: (hotelId: string, gm: User, recordId: string, decision: 'approved' | 'rejected', note?: string) => Promise<void>
}

function toDate(value: unknown): Date {
    if (value instanceof Timestamp) return value.toDate()
    if (value instanceof Date) return value
    return new Date(value as string | number)
}

function mapRecord(id: string, data: Record<string, unknown>): AttendanceRecord {
    const declaredClockIn = data.declared_clock_in_at || data.clock_in_at
    const declaredClockOut = data.declared_clock_out_at || data.clock_out_at
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
        declared_clock_in_at: toDate(declaredClockIn),
        declared_clock_out_at: declaredClockOut ? toDate(declaredClockOut) : null,
        actual_clock_in_at: null,
        actual_clock_out_at: null,
        auto_clocked_out: Boolean(data.auto_clocked_out),
        auto_clock_out_at: data.auto_clock_out_at ? toDate(data.auto_clock_out_at) : null,
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

interface AttendanceAuditTimes {
    clockIn: Date | null
    clockOut: Date | null
}

function mergeAuditTimes(record: AttendanceRecord, audit?: AttendanceAuditTimes): AttendanceRecord {
    return {
        ...record,
        actual_clock_in_at: audit?.clockIn || null,
        actual_clock_out_at: audit?.clockOut || null,
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
        declared_clock_in_at: clockIn,
        declared_clock_out_at: null,
        actual_clock_in_at: new Date(clockIn.getTime() + 2 * 60_000),
        actual_clock_out_at: null,
        auto_clocked_out: false,
        auto_clock_out_at: null,
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
            const records = demoRecords().map((record) => staffId ? mergeAuditTimes(record) : record)
            set({ records, loading: false })
            return () => undefined
        }

        const attendanceRef = collection(db, 'hotels', hotelId, 'attendance')
        const attendanceQuery = staffId
            ? query(attendanceRef, where('staff_id', '==', staffId))
            : query(attendanceRef, orderBy('work_date', 'desc'), limit(500))

        let baseRecords: AttendanceRecord[] = []
        let auditTimes: Record<string, AttendanceAuditTimes> = {}
        let attendanceReady = false
        let auditReady = Boolean(staffId)
        const publish = () => set({
            records: baseRecords
                .map((record) => mergeAuditTimes(record, auditTimes[record.id]))
                .sort((a, b) => b.declared_clock_in_at.getTime() - a.declared_clock_in_at.getTime()),
            loading: !(attendanceReady && auditReady),
            error: null,
        })

        const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
            baseRecords = snapshot.docs.map((item) => mapRecord(item.id, item.data()))
            attendanceReady = true
            publish()
        }, (error) => {
            console.error('Attendance subscription failed:', error)
            set({ loading: false, error: error.message })
        })

        if (staffId) return unsubscribeAttendance

        const eventsRef = collection(db, 'hotels', hotelId, 'attendance_events')
        const eventsQuery = query(eventsRef, orderBy('occurred_at', 'desc'), limit(2000))
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            const nextAuditTimes: Record<string, AttendanceAuditTimes> = {}
            snapshot.docs.forEach((item) => {
                const data = item.data()
                const recordId = String(data.record_id || '')
                const event = String(data.event || '')
                if (!recordId || !data.occurred_at || !['clock_in', 'clock_out', 'auto_clock_out'].includes(event)) return
                const current = nextAuditTimes[recordId] || { clockIn: null, clockOut: null }
                if (event === 'clock_in' && !current.clockIn) current.clockIn = toDate(data.occurred_at)
                if ((event === 'clock_out' || event === 'auto_clock_out') && !current.clockOut) current.clockOut = toDate(data.occurred_at)
                nextAuditTimes[recordId] = current
            })
            auditTimes = nextAuditTimes
            auditReady = true
            publish()
        }, (error) => {
            console.error('Attendance audit subscription failed:', error)
            auditReady = true
            set({
                loading: false,
                error: error.message,
            })
        })

        return () => {
            unsubscribeAttendance()
            unsubscribeEvents()
        }
    },

    clockIn: async (hotelId, user, assignment, declaredAt, excuse = '', managerPermission) => {
        const t = useLanguageStore.getState().t
        const now = new Date()
        if (Number.isNaN(declaredAt.getTime())) throw new Error('INVALID_DECLARED_TIME')
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
                declared_clock_in_at: declaredAt,
                declared_clock_out_at: null,
                actual_clock_in_at: now,
                actual_clock_out_at: null,
                auto_clocked_out: false,
                auto_clock_out_at: null,
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
                declared_clock_in_at: Timestamp.fromDate(declaredAt),
                clock_in_at: Timestamp.fromDate(declaredAt),
                declared_clock_out_at: null,
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
                auto_clocked_out: false,
                auto_clock_out_at: null,
                created_at: Timestamp.fromDate(declaredAt),
                updated_at: Timestamp.fromDate(declaredAt),
            })
            transaction.set(eventRef, {
                record_id: recordId,
                staff_id: user.uid,
                staff_name: user.name,
                event: 'clock_in',
                declared_at: Timestamp.fromDate(declaredAt),
                occurred_at: serverTimestamp(),
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

    clockOut: async (hotelId, user, recordId, declaredAt) => {
        const t = useLanguageStore.getState().t
        const now = new Date()
        if (Number.isNaN(declaredAt.getTime())) throw new Error('INVALID_DECLARED_TIME')
        if (hotelId === 'demo-hotel-id') {
            set({ records: get().records.map((record) => record.id === recordId ? {
                ...record,
                declared_clock_out_at: declaredAt,
                actual_clock_out_at: now,
                status: 'clocked_out',
                worked_minutes: Math.max(0, Math.floor((declaredAt.getTime() - record.declared_clock_in_at.getTime()) / 60_000)),
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
            const clockIn = toDate(data.declared_clock_in_at || data.clock_in_at)
            workedMinutes = Math.max(0, Math.floor((declaredAt.getTime() - clockIn.getTime()) / 60_000))
            transaction.update(recordRef, {
                declared_clock_out_at: Timestamp.fromDate(declaredAt),
                clock_out_at: Timestamp.fromDate(declaredAt),
                status: 'clocked_out',
                worked_minutes: workedMinutes,
                updated_at: Timestamp.fromDate(declaredAt),
            })
            transaction.set(eventRef, {
                record_id: recordId,
                staff_id: user.uid,
                staff_name: user.name,
                event: 'clock_out',
                declared_at: Timestamp.fromDate(declaredAt),
                occurred_at: serverTimestamp(),
                worked_minutes: workedMinutes,
            })
        })
        await useActivityStore.getState().logActivity(
            hotelId, user.uid, user.name, user.role, 'attendance_clock_out',
            `${Math.floor(workedMinutes / 60)} ${t('attendance.unit.hour')} ${workedMinutes % 60} ${t('attendance.unit.minute')}`,
        )
        toast.success(t('attendance.toast.clockOut'))
    },

    autoClockOut: async (hotelId, actor, record) => {
        const now = new Date()
        if (record.status !== 'clocked_in' || now < record.scheduled_end) return
        if (actor.role !== 'gm' && actor.uid !== record.staff_id) return

        const scheduledEnd = record.scheduled_end
        const workedMinutes = Math.max(0, Math.floor((scheduledEnd.getTime() - record.declared_clock_in_at.getTime()) / 60_000))

        if (hotelId === 'demo-hotel-id') {
            set({ records: get().records.map((item) => item.id === record.id ? {
                ...item,
                status: 'clocked_out',
                actual_clock_out_at: scheduledEnd,
                auto_clocked_out: true,
                auto_clock_out_at: scheduledEnd,
                worked_minutes: workedMinutes,
            } : item) })
            return
        }

        const recordRef = doc(db, 'hotels', hotelId, 'attendance', record.id)
        const eventRef = doc(db, 'hotels', hotelId, 'attendance_events', `${record.id}_auto_clock_out`)
        await runTransaction(db, async (transaction) => {
            const recordSnapshot = await transaction.get(recordRef)
            if (!recordSnapshot.exists()) return
            const data = recordSnapshot.data()
            if (data.status !== 'clocked_in') return
            const storedScheduledEnd = toDate(data.scheduled_end)
            if (new Date() < storedScheduledEnd) return
            const declaredClockIn = toDate(data.declared_clock_in_at || data.clock_in_at)
            const storedWorkedMinutes = Math.max(0, Math.floor((storedScheduledEnd.getTime() - declaredClockIn.getTime()) / 60_000))

            transaction.update(recordRef, {
                status: 'clocked_out',
                worked_minutes: storedWorkedMinutes,
                auto_clocked_out: true,
                auto_clock_out_at: Timestamp.fromDate(storedScheduledEnd),
                updated_at: serverTimestamp(),
            })
            transaction.set(eventRef, {
                record_id: record.id,
                staff_id: data.staff_id,
                staff_name: data.staff_name,
                event: 'auto_clock_out',
                occurred_at: Timestamp.fromDate(storedScheduledEnd),
                processed_at: serverTimestamp(),
                automatic: true,
                actor_id: actor.uid,
                actor_name: actor.name,
                actor_role: actor.role,
            })
        })
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
                occurred_at: serverTimestamp(),
            })
        })
        await useActivityStore.getState().logActivity(
            hotelId, gm.uid, gm.name, gm.role, 'attendance_review',
            `${decision === 'approved' ? t('attendance.report.approved') : t('attendance.report.rejected')} · ${cleanNote || '—'}`,
        )
        toast.success(decision === 'approved' ? t('attendance.toast.approved') : t('attendance.toast.rejected'))
    },
}))
