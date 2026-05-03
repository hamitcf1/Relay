import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Loader2, Database, Lock, Cpu } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

interface CyberLoadingScreenProps {
    onComplete?: () => void
}

export function CyberLoadingScreen({ onComplete }: CyberLoadingScreenProps) {
    const { t } = useLanguageStore()
    const [progress, setProgress] = useState(0)
    const [statusIndex, setStatusIndex] = useState(0)

    const statuses = [
        t('auth.loading.decrypting'),
        t('auth.loading.syncing'),
        t('auth.loading.initializing'),
        t('auth.loading.finalizing')
    ]

    useEffect(() => {
        const duration = 3500 // 3.5 seconds
        const interval = 50
        const steps = duration / interval
        const increment = 100 / steps

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment
                if (next >= 100) {
                    clearInterval(timer)
                    setTimeout(() => onComplete?.(), 500)
                    return 100
                }
                return next
            })
        }, interval)

        const statusInterval = setInterval(() => {
            setStatusIndex(prev => (prev + 1) % statuses.length)
        }, 800)

        return () => {
            clearInterval(timer)
            clearInterval(statusInterval)
        }
    }, [onComplete, statuses.length])

    return (
        <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ 
                opacity: 0, 
                filter: 'blur(20px)',
                scale: 1.1,
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),rgba(0,0,0,0))]" />
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 to-transparent" />
                
                {/* Animated Grid */}
                <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                        transform: `perspective(1000px) rotateX(60deg) translateY(${progress}px)`,
                        transition: 'transform 0.1s linear'
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
                {/* Main Visual */}
                <div className="relative mb-12">
                    <motion.div 
                        className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"
                            animate={{ y: ['100%', '-100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                        <Shield className="w-10 h-10 text-primary relative z-10" />
                    </div>
                </div>

                {/* Status Text */}
                <div className="h-12 flex flex-col items-center mb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={statusIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-3 text-white/80 font-mono text-sm tracking-wider uppercase"
                        >
                            {statusIndex === 0 && <Lock className="w-4 h-4 text-primary" />}
                            {statusIndex === 1 && <Database className="w-4 h-4 text-primary" />}
                            {statusIndex === 2 && <Cpu className="w-4 h-4 text-primary" />}
                            {statusIndex === 3 && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                            {statuses[statusIndex]}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5 relative">
                    <motion.div 
                        className="absolute top-0 left-0 bottom-0 bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Scanning Line */}
                    <motion.div 
                        className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ left: ['-20%', '120%'] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>

                {/* Stats */}
                <div className="flex justify-between w-full px-1">
                    <span className="text-[10px] text-zinc-500 font-mono">SYS_BOOT_SEQUENCE</span>
                    <span className="text-[10px] text-primary font-mono">{Math.round(progress)}%</span>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 text-[10px] text-zinc-700 font-mono space-y-1 hidden md:block">
                <p>RELAY_OS v4.2.0</p>
                <p>ENCRYPTION: AES-256-GCM</p>
                <p>STATUS: INITIALIZING...</p>
            </div>
            <div className="absolute bottom-10 right-10 text-[10px] text-zinc-700 font-mono text-right space-y-1 hidden md:block">
                <p>LOAD_ADDR: 0x7FFF0042</p>
                <p>SECURE_AUTH: ACTIVE</p>
                <p>LATENCY: 12ms</p>
            </div>
        </motion.div>
    )
}
