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

    useEffect(() => {
        // Only run check in production-like builds where version.json exists
        if (import.meta.env.DEV) return

        const checkVersion = async () => {
            try {
                // Fetch version.json from root with a cache buster
                const response = await fetch(`/version.json?cb=${Date.now()}`, {
                    cache: 'no-store'
                })
                if (!response.ok) return

                const data = await response.json()
                const serverVersion = Number(data.version)
                const localVersion = Number(__BUILD_VERSION__)

                if (serverVersion > localVersion) {
                    console.log('Update detected:', { serverVersion, localVersion })
                    setUpdateAvailable(true)
                }
            } catch (error) {
                console.error('Failed to check for updates:', error)
            }
        }

        // Initial check
        checkVersion()

        // Poll every 5 minutes
        const interval = setInterval(checkVersion, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        window.location.reload()
    }

    return (
        <AnimatePresence>
            {updateAvailable && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary/10 border-b border-primary/20 backdrop-blur-md sticky top-0 z-[100] overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                                <AlertCircle className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">
                                    {t('common.updateAvailable')}
                                </span>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                    {t('common.updateDescription')}
                                </span>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleRefresh}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('common.refreshNow')}
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
