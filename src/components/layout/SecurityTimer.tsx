import { motion } from 'framer-motion'
import { Timer, ShieldAlert } from 'lucide-react'
import { useSecurityStore } from '@/stores/securityStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

export function SecurityTimer() {
    const { countdown } = useSecurityStore()
    const { t } = useLanguageStore()

    if (countdown === null) {
        return null
    }

    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60
    const isCritical = countdown <= 10

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors",
                isCritical
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}
            role="status"
            aria-live="polite"
            aria-label={t('security.sessionCountdown')}
        >
            <div className="relative">
                <Timer className={cn("w-3.5 h-3.5", isCritical && "animate-pulse-critical")} aria-hidden="true" />
                {isCritical && <ShieldAlert className="absolute -top-1 -right-1 w-2 h-2 text-destructive" aria-hidden="true" />}
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">
                    {t('security.sessionCountdown')}
                </span>
                <span className="text-xs font-mono font-semibold tabular-nums">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </motion.div>
    )
}
