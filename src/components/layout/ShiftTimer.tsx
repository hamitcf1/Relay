import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Clock, Hourglass, LogOut } from 'lucide-react'
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
    const [clickCount, setClickCount] = useState(0)
    const [showEnough, setShowEnough] = useState<string | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    setClickCount(prev => {
                        const next = prev + 1
                        
                        const messages: Record<number, string> = {
                            5: "Focus!",
                            10: "Enough!",
                            15: "Get a coffee?",
                            20: "Seriously?",
                            50: "ULTRA BOREDOM"
                        }

                        if (messages[next]) {
                            setShowEnough(messages[next])
                            if (timeoutRef.current) clearTimeout(timeoutRef.current)
                            timeoutRef.current = setTimeout(() => setShowEnough(null), 2000)
                        }

                        return next >= 50 ? 0 : next
                    })
                }}
                className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-md transition-all duration-500 group relative select-none",
                    showEnough 
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-500 cursor-default"
                        : timeLeft === null
                            ? "bg-muted/10 border-border/20 text-muted-foreground/60 cursor-default"
                            : isCritical 
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-lg shadow-rose-500/10 cursor-default" 
                                : "bg-primary/10 border-primary/20 text-primary/90 cursor-default"
                )}
            >
                <div className="relative">
                    {showEnough ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                            {showEnough === "ULTRA BOREDOM" ? "🤯" : showEnough === "Seriously?" ? "🙄" : "🤫"}
                        </div>
                    ) : timeLeft === null ? (
                        <Clock className="w-4 h-4 opacity-40" />
                    ) : isCritical ? (
                        <Hourglass className="w-4 h-4 animate-pulse" />
                    ) : (
                        <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    )}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                        {showEnough ? 'Attention!' : (t('shift.timeLeft') || 'Shift Remaining')}
                    </span>
                    <span className="text-xs font-mono font-black tabular-nums flex items-center gap-1.5">
                        {showEnough || (
                            timeLeft === null ? (
                                '--:--'
                            ) : (
                                <>
                                    {hours > 0 ? `${hours}:` : ''}
                                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                                </>
                            )
                        )}
                        {!showEnough && <LogOut className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />}
                    </span>
                </div>

                {/* Hover Indicator */}
                <div className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/40"></span>
                </div>
            </motion.button>

        </>
    )
}
