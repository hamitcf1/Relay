import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShiftStore } from '@/stores/shiftStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'

export function ComplianceAlert() {
    const { currentShift, updateCompliance } = useShiftStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const checkTime = () => {
            if (!currentShift) return

            const now = new Date()
            const hour = now.getHours()

            // logic: If time is >= 23:00 AND KBS is NOT checked, show alert
            // We can also allow it to show if it's past 23:00 until shift end?
            // For now, let's say >= 23:00 and < 06:00 (next day) ??
            // OR just >= 23:00.

            // Critical time: 23:00
            const isLate = hour >= 23 || (hour >= 0 && hour < 6)

            if (isLate && !currentShift.compliance.kbs_checked) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        // Check every minute
        const interval = setInterval(checkTime, 60000)
        checkTime() // Initial check

        return () => clearInterval(interval)
    }, [currentShift])

    const handleQuickFix = async () => {
        if (!hotel?.id || !currentShift) return
        await updateCompliance(hotel.id, 'kbs_checked', true)
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
                >
                    <div className="bg-rose-500/10 backdrop-blur-xl border border-rose-500/50 rounded-xl p-4 shadow-2xl shadow-rose-900/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-rose-500/20 rounded-full animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-rose-500" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                                    CRITICAL ALERT
                                    <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-mono">23:00</span>
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {t('compliance.kbsLate') || 'KBS System check is required immediately! Please verify guest identities.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button
                                onClick={handleQuickFix}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-none shadow-lg shadow-rose-900/50 animate-pulse"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Mark Checked Now
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsVisible(false)}
                                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
