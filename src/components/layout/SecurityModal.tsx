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

    if (countdown === null || countdown > 10) return null
    if (user?.role === 'gm' && lastTriggerReason === 'shift_end') return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-card border border-rose-500/50 shadow-2xl shadow-rose-500/20 rounded-3xl p-8 text-center relative overflow-hidden"
                >
                    {/* Animated Background Pulse */}
                    <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                            <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse-critical" />
                        </div>

                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {t('security.sessionEnding')}
                        </h2>
                        <p className="text-muted-foreground mb-8 text-sm">
                            {t('security.shiftEndedDesc')}
                        </p>

                        <div className="text-6xl font-mono font-black text-rose-500 mb-10 tabular-nums">
                            {countdown}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                onClick={stopCountdown}
                                className="bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-2xl gap-2 shadow-lg shadow-primary/20"
                            >
                                <RotateCcw className="w-5 h-5" />
                                {t('security.extendSession')}
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={async () => {
                                    await logout()
                                    window.location.href = '/login'
                                }}
                                className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 h-12 rounded-2xl gap-2"
                            >
                                <LogOut className="w-5 h-5" />
                                {t('auth.logout')}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
