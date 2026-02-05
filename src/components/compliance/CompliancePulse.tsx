import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'

interface CompliancePulseProps {
    percentage: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    className?: string
}

export function CompliancePulse({
    percentage,
    size = 'md',
    showLabel = true,
    className
}: CompliancePulseProps) {
    const { t } = useLanguageStore()
    // Size configurations
    const sizes = {
        sm: { outer: 40, inner: 32, stroke: 3, text: 'text-xs' },
        md: { outer: 56, inner: 44, stroke: 4, text: 'text-sm' },
        lg: { outer: 80, inner: 64, stroke: 5, text: 'text-base' },
    }

    const config = sizes[size]
    const radius = (config.inner - config.stroke) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    // Color based on percentage
    const getColor = (pct: number) => {
        if (pct === 100) return { ring: 'stroke-emerald-400', text: 'text-emerald-400', glow: 'shadow-emerald-400/30' }
        if (pct >= 50) return { ring: 'stroke-amber-400', text: 'text-amber-400', glow: 'shadow-amber-400/30' }
        return { ring: 'stroke-rose-400', text: 'text-rose-400', glow: 'shadow-rose-400/30' }
    }

    const colors = getColor(percentage)

    return (
        <div className={cn('relative inline-flex items-center gap-2', className)}>
            {/* SVG Ring */}
            <div
                className="relative"
                style={{ width: config.outer, height: config.outer }}
            >
                <svg
                    width={config.outer}
                    height={config.outer}
                    className="transform -rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={config.outer / 2}
                        cy={config.outer / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={config.stroke}
                        className="text-zinc-800"
                    />

                    {/* Progress circle */}
                    <motion.circle
                        cx={config.outer / 2}
                        cy={config.outer / 2}
                        r={radius}
                        fill="none"
                        strokeWidth={config.stroke}
                        strokeLinecap="round"
                        className={colors.ring}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                            strokeDasharray: circumference,
                        }}
                    />
                </svg>

                {/* Percentage text in center */}
                <div className={cn(
                    'absolute inset-0 flex items-center justify-center font-bold',
                    colors.text,
                    config.text
                )}>
                    {percentage}%
                </div>

                {/* Glow effect for 100% */}
                {percentage === 100 && (
                    <div className={cn(
                        'absolute inset-0 rounded-full animate-pulse',
                        'shadow-lg',
                        colors.glow
                    )} />
                )}
            </div>

            {/* Label */}
            {showLabel && (
                <div className="text-xs text-zinc-500">
                    {t('module.compliance')}
                </div>
            )}
        </div>
    )
}
