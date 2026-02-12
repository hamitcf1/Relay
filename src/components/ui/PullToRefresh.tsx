
import { useRef, useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: React.ReactNode
    className?: string
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const controls = useAnimation()

    // We'll use simple touch events instead of complex gesture libraries to keep it lightweight
    const [startY, setStartY] = useState(0)
    const [pullDistance, setPullDistance] = useState(0)
    const THRESHOLD = 80 // px to trigger refresh
    const MAX_PULL = 150 // max visual pull

    useEffect(() => {
        if (!isRefreshing) {
            controls.start({ y: 0 })
        }
    }, [isRefreshing, controls])

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
            setStartY(e.touches[0].clientY)
        }
    }

    const handleTouchMove = async (e: React.TouchEvent) => {
        if (startY === 0 || isRefreshing) return

        // Only pull if we are at the top
        if (containerRef.current && containerRef.current.scrollTop > 0) {
            setStartY(0)
            return
        }

        const currentY = e.touches[0].clientY
        const diff = currentY - startY

        if (diff > 0) {
            // Resistance effect
            const newPull = Math.min(diff * 0.5, MAX_PULL)
            setPullDistance(newPull)
            controls.set({ y: newPull })

            // Haptic feedback when crossing threshold
            if (newPull >= THRESHOLD && pullDistance < THRESHOLD && Capacitor.isNativePlatform()) {
                // Throttle haptics slightly or just fire once
                // We need to be careful not to spam haptics on every move event
            }
        }
    }

    const handleTouchEnd = async () => {
        if (startY === 0 || isRefreshing) return

        if (pullDistance >= THRESHOLD) {
            setIsRefreshing(true)
            controls.start({ y: THRESHOLD }) // Stay at threshold while refreshing

            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Medium })
            }

            try {
                await onRefresh()
            } finally {
                setIsRefreshing(false)
                setStartY(0)
                setPullDistance(0)
                controls.start({ y: 0 })
            }
        } else {
            // Snap back
            controls.start({ y: 0 })
            setStartY(0)
            setPullDistance(0)
        }
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-y-auto h-full ${className || ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Refresh Indicator */}
            {pullDistance > 0 && (
                <motion.div
                    className="absolute top-0 left-0 right-0 flex justify-center items-start pointer-events-none z-10 pt-4"
                    style={{ y: -40 }} // Visual fix: Start hidden above
                    animate={{
                        y: isRefreshing ? 10 : Math.min(pullDistance / 2 - 10, 10),
                        opacity: isRefreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1),
                        rotate: isRefreshing ? 360 : pullDistance * 2
                    }}
                    transition={isRefreshing ? { rotate: { repeat: Infinity, duration: 1, ease: "linear" } } : { duration: 0.2 }}
                >
                    <div className="bg-background/80 backdrop-blur-md rounded-full p-2 shadow-lg border border-border">
                        <Loader2 className="w-5 h-5 text-primary" />
                    </div>
                </motion.div>
            )}

            <motion.div animate={controls} className="min-h-full">
                {children}
            </motion.div>
        </div>
    )
}
