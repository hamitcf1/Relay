import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface ToggleProps {
    label: string
    value: boolean
    onChange: () => void
    description?: string
    disabled?: boolean
}

/**
 * An on/off setting.
 *
 * Extracted from AppearanceOptions, which had one copy, so that a second setting does not add a
 * second implementation. `aria-pressed` matches the rest of the preference controls in this app
 * (the navigation editor and the theme and accent pickers all use it) rather than switching to
 * `role="switch"` for this one screen.
 */
export function Toggle({ label, value, onChange, description, disabled }: ToggleProps) {
    return (
        <button
            type="button"
            onClick={onChange}
            disabled={disabled}
            aria-pressed={value}
            className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/40 text-left transition-colors',
                disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-card/70 hover:border-border'
            )}
        >
            <div className="min-w-0 pr-3">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
            </div>
            <div
                className={cn(
                    'w-9 h-5 rounded-full relative transition-colors shrink-0',
                    value ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
            >
                <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: value ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </div>
        </button>
    )
}
