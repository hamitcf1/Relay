import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
    className?: string
}

/**
 * Rich empty state component with icon, title, description and optional CTA.
 * Uses subtle animation and dot-grid background for visual depth.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-col items-center justify-center py-16 text-center relative ${className || ''}`}
        >
            {/* Dot grid background */}
            <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none rounded-xl" />

            {/* Icon container */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
                className="relative w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5"
            >
                <Icon className="w-7 h-7 text-primary/40" />

                {/* Subtle glow */}
                <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl" />
            </motion.div>

            <h3 className="font-semibold text-foreground text-base mb-1.5 relative">{title}</h3>

            {description && (
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed relative">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    size="sm"
                    className="mt-6 rounded-xl relative"
                >
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    )
}
