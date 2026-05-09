import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Hourglass } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useShiftStore } from '@/stores/shiftStore'
import { useRosterStore, type ShiftType } from '@/stores/rosterStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useSecurityStore } from '@/stores/securityStore'
import { cn } from '@/lib/utils'

export function ShiftTimer() {
    const { currentShift } = useShiftStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { startCountdown } = useSecurityStore()
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const user = useAuthStore(state => state.user)
    const schedule = useRosterStore(state => state.schedule)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const dateKey = format(now, 'yyyy-MM-dd')
            
            // 1. Try roster for current user (Personalized)
            // 2. Try current active shift (Fallback/Global)
            // 3. If GM, try heuristic fallback
            let shiftType: ShiftType | null = null
            
            if (user && schedule[user.uid]?.[dateKey] && schedule[user.uid][dateKey] !== 'OFF') {
                shiftType = schedule[user.uid][dateKey]
            } else if (currentShift) {
                shiftType = currentShift.type as ShiftType
            }

            // Fallback for GMs or non-rostered users: heuristic based on current time
            if (!shiftType && user?.role === 'gm') {
                const hour = now.getHours()
                if (hour >= 8 && hour < 16) shiftType = 'A'
                else if (hour >= 16 || hour < 0) shiftType = 'B'
                else if (hour >= 0 && hour < 8) shiftType = 'C'
            }

            if (!shiftType || shiftType === 'OFF') {
                setTimeLeft(null)
                return
            }

            // Use configured shifts from hotel settings, or fall back to defaults
            const shifts = hotel?.settings?.shifts || []
            const defaultMap: Record<string, string> = { 'A': '16:00', 'B': '00:00', 'C': '08:00', 'E': '18:00' }
            
            const shiftConfig = shifts.find((s: any) => s.code === shiftType)
            const endTime = shiftConfig?.endTime || defaultMap[shiftType] || '16:00'

            const [hours, minutes] = endTime.split(':').map(Number)
            let end = new Date(now)
            end.setHours(hours, minutes, 0, 0)

            // Midnight rollover handling
            if (endTime === '00:00' || endTime < '08:00') {
                if (now.getHours() >= 16) { // It's the evening before the rollover
                    end = addDays(end, 1)
                }
            }

            const diff = Math.floor((end.getTime() - now.getTime()) / 1000)
            
            // Check for Auto-Logout
            if (diff <= 0 && !isLoggingOut) {
                setIsLoggingOut(true)
                startCountdown(60, 'shift_end')
            }

            // Only show timer if we are within the shift window (roughly)
            // If shift starts at 08:00 and ends at 16:00, and it's 07:00, diff is positive.
            if (diff > 43200 || diff < -1800) { // More than 12 hours left or more than 30 mins past
                setTimeLeft(null)
            } else {
                setTimeLeft(diff > 0 ? diff : 0)
            }
        }

        calculateTimeLeft()
        const interval = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(interval)
    }, [currentShift, hotel, user, schedule, startCountdown, isLoggingOut])

    if (timeLeft === null) {
        return null
    }

    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60
    const isCritical = timeLeft !== null && timeLeft <= 1800 // 30 minutes

    return (
        <>
            <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors group select-none",
                    timeLeft === null
                        ? "bg-muted/40 border-border text-muted-foreground"
                        : isCritical
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : "bg-muted/40 border-border text-foreground"
                )}
            >
                <div className="relative">
                    {timeLeft === null ? (
                        <Clock className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
                    ) : isCritical ? (
                        <Hourglass className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                    ) : (
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('shift.timeLeft') || 'Shift'}
                    </span>
                    <span className="text-xs font-mono font-semibold tabular-nums">
                        {timeLeft === null ? (
                            '--:--'
                        ) : (
                            <>
                                {hours > 0 ? `${hours}:` : ''}
                                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                            </>
                        )}
                    </span>
                </div>
            </motion.button>

        </>
    )
}
