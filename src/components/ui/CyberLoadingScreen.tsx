import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ConciergeBell } from 'lucide-react'

interface CyberLoadingScreenProps {
    onComplete?: () => void
}

export function CyberLoadingScreen({ onComplete }: CyberLoadingScreenProps) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const duration = 600
        const steps = 12
        const interval = duration / steps
        const increment = 100 / steps

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment
                if (next >= 100) {
                    clearInterval(timer)
                    setTimeout(() => onComplete?.(), 150)
                    return 100
                }
                return next
            })
        }, interval)

        return () => clearInterval(timer)
    }, [onComplete])

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
        >
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <ConciergeBell className="w-6 h-6 text-primary-foreground" />
                </div>

                <div className="w-48 h-0.5 bg-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-[width] duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
