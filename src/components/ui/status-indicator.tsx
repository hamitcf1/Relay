import { cn } from '@/lib/utils'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical'

const toneClasses: Record<StatusTone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-primary/10 text-primary',
    success: 'bg-success/12 text-success',
    warning: 'bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]',
    critical: 'bg-destructive/12 text-destructive',
}

interface StatusIndicatorProps {
    tone?: StatusTone
    label: string
    className?: string
}

export function StatusIndicator({ tone = 'neutral', label, className }: StatusIndicatorProps) {
    return (
        <span className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', toneClasses[tone], className)}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {label}
        </span>
    )
}
