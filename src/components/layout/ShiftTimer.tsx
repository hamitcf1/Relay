import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Hourglass, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { useShiftStore } from '@/stores/shiftStore'
import { useRosterStore, type ShiftType } from '@/stores/rosterStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import { ShiftManagementModal } from '@/components/layout/ShiftManagementModal'

export function ShiftTimer() {
    const { currentShift } = useShiftStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)

    const user = useAuthStore(state => state.user)
    const schedule = useRosterStore(state => state.schedule)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const dateKey = format(now, 'yyyy-MM-dd')
            
            // 1. Try to find shift from Active Shift Store (manual or automated)
            // 2. Fallback to Weekly Roster for the current user
            let shiftType: ShiftType | null = currentShift?.type as ShiftType || null
            
            if (!shiftType && user && schedule[user.uid]) {
                shiftType = schedule[user.uid][dateKey]
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
            if (end <= now && (endTime === '00:00' || endTime < '08:00')) {
                end.setDate(end.getDate() + 1)
            } else if (end <= now) {
                // If it's already past the end time of a day shift, don't show timer for tomorrow's shift yet
                setTimeLeft(null)
                return
            }

            const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
            
            // Only show timer if we are within the shift window (roughly)
            // If the shift ended 5 hours ago, we shouldn't show a 19 hour countdown to tomorrow's shift
            if (diff > 43200) { // More than 12 hours left
                setTimeLeft(null)
            } else {
                setTimeLeft(diff)
            }
        }

        calculateTimeLeft()
        const interval = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(interval)
    }, [currentShift, hotel, user, schedule])

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
                onClick={() => setShowModal(true)}
                className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-md transition-all duration-500 group relative",
                    timeLeft === null
                        ? "bg-muted/10 border-border/20 text-muted-foreground/60"
                        : isCritical 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-lg shadow-rose-500/10" 
                            : "bg-primary/10 border-primary/20 text-primary/90 hover:bg-primary/20"
                )}
            >
                <div className="relative">
                    {timeLeft === null ? (
                        <Clock className="w-4 h-4 opacity-40" />
                    ) : isCritical ? (
                        <Hourglass className="w-4 h-4 animate-pulse" />
                    ) : (
                        <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    )}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                        {t('shift.timeLeft') || 'Shift Remaining'}
                    </span>
                    <span className="text-xs font-mono font-black tabular-nums flex items-center gap-1.5">
                        {timeLeft === null ? (
                            '--:--'
                        ) : (
                            <>
                                {hours > 0 ? `${hours}:` : ''}
                                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                            </>
                        )}
                        <LogOut className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </span>
                </div>

                {/* Hover Indicator */}
                <div className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/40"></span>
                </div>
            </motion.button>

            <ShiftManagementModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                hotelId={hotel?.id || ''} 
            />
        </>
    )
}
