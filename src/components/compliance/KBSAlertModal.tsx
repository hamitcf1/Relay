import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/stores/languageStore'

interface KBSAlertModalProps {
    isOpen: boolean
    onClose: () => void
    onCheckKBS: () => Promise<void>
}

export function KBSAlertModal({ isOpen, onClose, onCheckKBS }: KBSAlertModalProps) {
    const { t } = useLanguageStore()
    const [loading, setLoading] = useState(false)

    const handleCheck = async () => {
        setLoading(true)
        try {
            await onCheckKBS()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-rose-500/50 bg-zinc-900"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.4 }}
                        >
                            {/* Critical header with glow */}
                            <div className="relative p-6 text-center bg-gradient-to-b from-rose-500/20 to-transparent">
                                {/* Animated glow */}
                                <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />

                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-lg transition-colors z-10"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>

                                {/* Icon */}
                                <motion.div
                                    className="inline-flex p-4 rounded-full bg-rose-500/20 mb-4"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        boxShadow: [
                                            '0 0 0 0 rgba(244, 63, 94, 0.4)',
                                            '0 0 0 20px rgba(244, 63, 94, 0)',
                                            '0 0 0 0 rgba(244, 63, 94, 0)'
                                        ]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                >
                                    <AlertTriangle className="w-10 h-10 text-rose-400" />
                                </motion.div>

                                <h2 className="text-2xl font-bold text-rose-400 mb-2">
                                    {t('compliance.kbs.required')}
                                </h2>
                                <div className="flex items-center justify-center gap-2 text-zinc-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{t('compliance.kbs.pastTime')}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-center text-zinc-300 mb-6">
                                    {t('compliance.kbs.desc')}
                                </p>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1"
                                    >
                                        {t('compliance.kbs.remindLater')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleCheck}
                                        disabled={loading}
                                        className="flex-1 bg-rose-600 hover:bg-rose-700"
                                    >
                                        {loading ? t('common.loading') : t('compliance.kbs.checkNow')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Hook to trigger KBS alert at 23:00
export function useKBSAlert(
    shiftType: 'B' | 'C' | null,
    kbsChecked: boolean
): boolean {
    const [showAlert, setShowAlert] = useState(false)

    useEffect(() => {
        // Only show alert for B/C shifts (evening/night)
        if (!shiftType || !['B', 'C'].includes(shiftType) || kbsChecked) {
            setShowAlert(false)
            return
        }

        const checkTime = () => {
            const now = new Date()
            const hours = now.getHours()

            // Show alert if it's 23:00 or later and KBS not checked
            if (hours >= 23 && !kbsChecked) {
                setShowAlert(true)
            }
        }

        // Check immediately
        checkTime()

        // Check every minute
        const interval = setInterval(checkTime, 60000)

        return () => clearInterval(interval)
    }, [shiftType, kbsChecked])

    return showAlert
}
