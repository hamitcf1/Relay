import { useEffect, useRef } from 'react'
import { addDoc, collection, doc, setDoc, increment, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { format } from 'date-fns'

const SYNC_INTERVAL_MS = 60 * 1000 * 5 // 5 minutes

export function ActivityTracker() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()

    const sessionStartRef = useRef<Date | null>(null)
    const timeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const isVisibleRef = useRef<boolean>(document.visibilityState === 'visible')

    const flushData = async () => {
        if (!user || !hotel || !sessionStartRef.current) return

        const now = new Date()
        const start = sessionStartRef.current
        const durationMinutes = (now.getTime() - start.getTime()) / 1000 / 60

        if (durationMinutes < 0.1) return

        const dateKey = format(now, 'yyyy-MM-dd')
        const logId = `${user.uid}_${dateKey}`
        const logRef = doc(db, 'hotels', hotel.id, 'activity_logs', logId)
        const sessionsRef = collection(logRef, 'sessions')

        try {
            await Promise.all([
                setDoc(logRef, {
                    id: logId,
                    user_id: user.uid,
                    user_name: user.name,
                    hotel_id: hotel.id,
                    date: dateKey,
                    last_active: Timestamp.fromDate(now),
                    total_active_minutes: increment(durationMinutes),
                }, { merge: true }),
                addDoc(sessionsRef, {
                    start: Timestamp.fromDate(start),
                    end: Timestamp.fromDate(now),
                    duration_minutes: durationMinutes,
                }),
            ])

            sessionStartRef.current = isVisibleRef.current ? new Date() : null
        } catch (error) {
            console.error("Error syncing activity log:", error)
        }
    }

    useEffect(() => {
        if (!user || !hotel) return

        // Initial start
        if (document.visibilityState === 'visible') {
            sessionStartRef.current = new Date()
            isVisibleRef.current = true
        }

        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible'
            isVisibleRef.current = isVisible

            if (isVisible) {
                // Resume session
                sessionStartRef.current = new Date()
            } else {
                // Pause session -> Flush
                flushData()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Periodic sync to avoid data loss on crash

        // Periodic sync to avoid data loss on crash
        timeoutRef.current = setInterval(flushData, SYNC_INTERVAL_MS)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (timeoutRef.current) clearInterval(timeoutRef.current)
            flushData() // Final flush on unmount
        }
    }, [user?.uid, hotel?.id])

    return null // Invisible component
}
