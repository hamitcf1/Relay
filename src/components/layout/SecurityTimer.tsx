import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Timer, ShieldAlert } from 'lucide-react'
import { useSecurityStore } from '@/stores/securityStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SecurityTimer() {
    const { countdown, triggerManualCheck } = useSecurityStore()
    const { t } = useLanguageStore()

    if (countdown === null) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={triggerManualCheck}
                className="h-9 px-3 gap-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all hidden md:flex"
                title={t('security.manualTrigger')}
            >
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t('security.manualCheck')}</span>
            </Button>
        )
    }

    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60
    const isCritical = countdown <= 10

    return (
        <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerManualCheck}
            className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border backdrop-blur-md transition-all duration-500 group",
                isCritical 
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/20" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500/90 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-lg shadow-amber-500/5"
            )}
        >
            <div className="relative">
                <Timer className={cn("w-4 h-4 transition-transform group-hover:rotate-12", isCritical && "animate-pulse-critical")} />
                {isCritical && <ShieldAlert className="absolute -top-1 -right-1 w-2 h-2 text-rose-500 animate-ping" />}
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                    {t('security.sessionCountdown')}
                </span>
                <span className="text-xs font-mono font-black tabular-nums">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </motion.button>
    )
}
