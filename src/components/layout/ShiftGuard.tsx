import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useSecurityStore } from '@/stores/securityStore'

/**
 * ShiftGuard monitor's the user's shift status and enforces session security.
 * When a shift ends or the user is not on the roster, it triggers a countdown to auto-logout.
 */
export function ShiftGuard() {
    const { user, signOut } = useAuthStore()
    const { currentShift } = useShiftStore()
    const { hotel } = useHotelStore()
    const { 
        countdown, 
        setCountdown, 
        showOverlay, 
        setShowOverlay, 
        startCountdown, 
        stopCountdown,
        lastTriggerReason 
    } = useSecurityStore()
    
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const prevShiftId = useRef<string | null>(null)

    useEffect(() => {
        if (!user || !hotel?.id) {
            stopCountdown()
            return
        }

        // GMs are exempt from automated shift-end logouts
        if (user.role === 'gm') {
            if (lastTriggerReason === 'shift_end') {
                stopCountdown()
            }
            return
        }

        // Detect shift change or end
        if (prevShiftId.current && !currentShift) {
            // Shift just ended
            startCountdown(60, 'shift_end')
        } else if (currentShift && prevShiftId.current !== currentShift.shift_id) {
            // New shift started, check if user is in it
            const isPart = currentShift.staff_ids.includes(user.uid)
            if (!isPart) {
                startCountdown(60, 'shift_end')
            } else {
                stopCountdown()
            }
        }

        prevShiftId.current = currentShift?.shift_id || null
    }, [user, currentShift, hotel?.id])

    // Countdown logic
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            timerRef.current = setTimeout(() => {
                const nextVal = countdown - 1
                setCountdown(nextVal)
                
                // Automatically show overlay in the last 10 seconds
                if (nextVal <= 10 && !showOverlay) {
                    setShowOverlay(true)
                }
            }, 1000)
        } else if (countdown === 0) {
            handleLogout()
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [countdown, showOverlay])

    const handleLogout = async () => {
        await signOut()
        window.location.href = '/login'
    }

    return null
}
