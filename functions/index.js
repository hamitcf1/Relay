const { initializeApp } = require('firebase-admin/app')
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore')
const { logger } = require('firebase-functions')
const { onSchedule } = require('firebase-functions/v2/scheduler')

initializeApp()

const db = getFirestore()
const BATCH_LIMIT = 500

function asDate(value) {
    return value && typeof value.toDate === 'function' ? value.toDate() : null
}

exports.autoClockOutAttendance = onSchedule({
    schedule: 'every 5 minutes',
    timeZone: 'Europe/Istanbul',
    region: 'europe-west1',
    timeoutSeconds: 300,
    memory: '256MiB',
    maxInstances: 1,
}, async () => {
    const now = Timestamp.now()
    const expired = await db.collectionGroup('attendance')
        .where('status', '==', 'clocked_in')
        .where('scheduled_end', '<=', now)
        .limit(BATCH_LIMIT)
        .get()

    if (expired.empty) {
        logger.info('No expired attendance records found.')
        return
    }

    let closed = 0
    let skipped = 0

    await Promise.all(expired.docs.map(async (snapshot) => {
        const attendanceRef = snapshot.ref
        const hotelRef = attendanceRef.parent.parent

        if (!hotelRef) {
            logger.warn('Attendance record is not nested below a hotel.', { path: attendanceRef.path })
            skipped += 1
            return
        }

        const eventRef = hotelRef.collection('attendance_events').doc(`${attendanceRef.id}_auto_clock_out`)

        const didClose = await db.runTransaction(async (transaction) => {
            const [freshSnapshot, eventSnapshot] = await Promise.all([
                transaction.get(attendanceRef),
                transaction.get(eventRef),
            ])

            if (!freshSnapshot.exists) return false

            const record = freshSnapshot.data()
            const scheduledEnd = asDate(record.scheduled_end)
            if (record.status !== 'clocked_in' || !scheduledEnd || scheduledEnd.getTime() > Date.now()) return false

            const actualClockIn = asDate(record.actual_clock_in_at) || asDate(record.declared_clock_in_at)
            const workedMinutes = actualClockIn
                ? Math.max(0, Math.round((scheduledEnd.getTime() - actualClockIn.getTime()) / 60000))
                : 0

            transaction.update(attendanceRef, {
                status: 'clocked_out',
                declared_clock_out_at: null,
                actual_clock_out_at: record.scheduled_end,
                worked_minutes: workedMinutes,
                auto_clocked_out: true,
                auto_clock_out_at: record.scheduled_end,
                updated_at: FieldValue.serverTimestamp(),
            })

            if (!eventSnapshot.exists) {
                transaction.set(eventRef, {
                    record_id: attendanceRef.id,
                    event: 'auto_clock_out',
                    staff_id: record.staff_id,
                    staff_name: record.staff_name || '',
                    staff_role: record.staff_role || 'receptionist',
                    work_date: record.work_date,
                    shift_type: record.shift_type,
                    declared_at: null,
                    occurred_at: record.scheduled_end,
                    processed_at: FieldValue.serverTimestamp(),
                    actor_id: 'relay-system',
                    actor_name: 'Relay Scheduler',
                    actor_role: 'system',
                    automatic: true,
                })
            }

            return true
        })

        if (didClose) closed += 1
        else skipped += 1
    }))

    logger.info('Automatic clock-out reconciliation completed.', {
        candidates: expired.size,
        closed,
        skipped,
        batchLimit: BATCH_LIMIT,
    })
})
