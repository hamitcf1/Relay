import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/stores/languageStore'

declare global {
    const __BUILD_VERSION__: string
}

export function UpdateNotifier() {
    const { t } = useLanguageStore()
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [isDismissed, setIsDismissed] = useState(() => {
        // In dev mode, we might want to hide this if the versions match exactly
        // but for now let's just use localStorage for dismissal
        return localStorage.getItem('relay_update_dismissed') === 'true'
    })

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const response = await fetch(`/version.json?cb=${Date.now()}`, {
                    cache: 'no-store'
                })
                if (!response.ok) return

                const data = await response.json()
                const serverVersion = Number(data.version)
                const localVersion = Number(__BUILD_VERSION__)

                if (serverVersion > localVersion && !isDismissed) {
                    setUpdateAvailable(true)
                } else if (serverVersion <= localVersion) {
                    // If we're up to date, reset dismissal for future updates
                    setUpdateAvailable(false)
                    localStorage.removeItem('relay_update_dismissed')
                    setIsDismissed(false)
                }
            } catch (error) {
                console.error('Failed to check for updates:', error)
            }
        }

        checkVersion()
        const interval = setInterval(checkVersion, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [isDismissed])

    const handleRefresh = () => {
        setUpdateAvailable(false)
        localStorage.removeItem('relay_update_dismissed')
        window.location.reload()
    }

    const handleDismiss = () => {
        setUpdateAvailable(false)
        setIsDismissed(true)
        localStorage.setItem('relay_update_dismissed', 'true')
    }

    return (
        <AnimatePresence>
            {updateAvailable && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary/20 border-b border-primary/30 backdrop-blur-xl sticky top-0 z-[100] overflow-hidden group/update"
                >
                    <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                                <AlertCircle className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground leading-tight">
                                    {t('common.updateAvailable') || 'Yeni Sürüm Mevcut'}
                                </span>
                                <span className="text-[10px] text-muted-foreground hidden sm:inline uppercase tracking-wider font-medium opacity-70">
                                    {t('common.updateDescription') || 'En son özellikler ve iyileştirmeler için sayfayı yenileyin.'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="h-8 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5"
                            >
                                {t('common.dismiss') || 'Yoksay'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleRefresh}
                                className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 text-[11px] font-bold px-4"
                            >
                                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                {t('common.refreshNow') || 'Şimdi Yenile'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
