import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

interface DateTimeWidgetProps {
    className?: string
}

export function DateTimeWidget({ className }: DateTimeWidgetProps) {
    const { language } = useLanguageStore()
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: 'numeric',
            month: 'short'
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-full glass",
                className
            )}
        >
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3 h-3 text-indigo-500 dark:text-indigo-300" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{formatDate(time)}</span>
            </div>
            <div className="w-[1px] h-3 bg-border" />
            <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-purple-500 dark:text-purple-300" />
                <span className="text-xs font-mono font-medium text-foreground tabular-nums">
                    {formatTime(time)}
                </span>
            </div>
        </motion.div>
    )
}
