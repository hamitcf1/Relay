import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, LogOut, RotateCcw } from 'lucide-react'
import { useSecurityStore } from '@/stores/securityStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function SecurityModal() {
    const { countdown, stopCountdown, lastTriggerReason } = useSecurityStore()
    const { t } = useLanguageStore()
    const { user, signOut: logout } = useAuthStore()

    if (countdown === null) return null
    if (lastTriggerReason === 'idle' && countdown > 60) return null
    if (user?.role === 'gm' && lastTriggerReason === 'shift_end') return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-card border border-destructive/40 rounded-2xl p-8 text-center"
                >
                    <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-5">
                        <ShieldAlert className="w-7 h-7 text-destructive" aria-hidden="true" />
                    </div>

                    <h2 className="text-lg font-semibold text-foreground mb-1.5 tracking-tight">
                        {t('security.sessionEnding')}
                    </h2>
                    <p className="text-muted-foreground mb-6 text-sm">
                        {t('security.shiftEndedDesc')}
                    </p>

                    <div className="text-4xl font-mono font-bold text-destructive mb-6 tabular-nums">
                        {countdown}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button onClick={stopCountdown}>
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                            {t('security.extendSession')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                await logout()
                                window.location.href = '/login'
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            {t('auth.logout')}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
