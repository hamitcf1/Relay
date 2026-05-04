import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Hourglass } from 'lucide-react'
import { useShiftStore } from '@/stores/shiftStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

export function ShiftTimer() {
    const { currentShift } = useShiftStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useEffect(() => {
        if (!currentShift || !hotel?.settings?.shifts) {
            setTimeLeft(null)
            return
        }

        const shiftConfig = hotel.settings.shifts.find((s: any) => s.code === currentShift.type)
        if (!shiftConfig || !shiftConfig.endTime) {
            setTimeLeft(null)
            return
        }

        const updateTimer = () => {
            const now = new Date()
            const [hours, minutes] = shiftConfig.endTime.split(':').map(Number)
            
            let end = new Date(now)
            end.setHours(hours, minutes, 0, 0)

            // If end time is before now, it might be the next day (e.g. 00:00 or 08:00 for night shift)
            if (end <= now) {
                end.setDate(end.getDate() + 1)
            }

            const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
            setTimeLeft(diff)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [currentShift, hotel])


    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60
    const isCritical = timeLeft !== null && timeLeft <= 1800 // 30 minutes

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-md transition-all duration-500",
                timeLeft === null
                    ? "bg-muted/10 border-border/20 text-muted-foreground/60"
                    : isCritical 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-lg shadow-rose-500/10" 
                        : "bg-primary/10 border-primary/20 text-primary/90"
            )}
        >
            <div className="relative">
                {timeLeft === null ? (
                    <Clock className="w-4 h-4 opacity-40" />
                ) : isCritical ? (
                    <Hourglass className="w-4 h-4 animate-pulse" />
                ) : (
                    <Clock className="w-4 h-4" />
                )}
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                    {t('shift.timeLeft') || 'Shift Remaining'}
                </span>
                <span className="text-xs font-mono font-black tabular-nums">
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
        </motion.div>
    )
}
