import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompactModuleCardProps {
    id: string
    label: string
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    onInteract?: () => void
    children: ReactNode
}

export function CompactModuleCard({ id, label, expanded, onExpandedChange, onInteract, children }: CompactModuleCardProps) {
    const contentId = `compact-module-${id}`
    return (
        <section data-testid={`compact-card-${id}`} onFocusCapture={onInteract} onPointerDown={onInteract} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => onExpandedChange(!expanded)} className="flex w-full items-center justify-between gap-3 border-b border-border/70 px-4 py-3 text-left hover:bg-muted/50">
                <span className="text-sm font-semibold">{label}</span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
            </button>
            {expanded && <div id={contentId} className="min-w-0 p-3">{children}</div>}
        </section>
    )
}
