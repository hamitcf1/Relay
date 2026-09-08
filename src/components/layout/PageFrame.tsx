import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageFrameProps {
    eyebrow?: ReactNode
    title: ReactNode
    description?: ReactNode
    action?: ReactNode
    filters?: ReactNode
    children: ReactNode
    className?: string
    contentClassName?: string
}

export function PageFrame({
    eyebrow,
    title,
    description,
    action,
    filters,
    children,
    className,
    contentClassName,
}: PageFrameProps) {
    return (
        <main className={cn('mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 md:pb-10 md:pt-7 lg:px-8', className)}>
            <header className="mb-6 border-b border-border/70 pb-5 md:mb-7 md:flex md:items-end md:justify-between md:gap-8">
                <div className="min-w-0 max-w-3xl">
                    {eyebrow && <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground">{eyebrow}</div>}
                    <h1 className="text-balance text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">{title}</h1>
                    {description && <p className="mt-2 max-w-[65ch] text-pretty text-sm leading-6 text-muted-foreground">{description}</p>}
                </div>
                {action && <div className="mt-4 flex shrink-0 items-center gap-2 md:mt-0">{action}</div>}
            </header>
            {filters && <section aria-label="Filters" className="mb-5">{filters}</section>}
            <div className={cn('min-w-0', contentClassName)}>{children}</div>
        </main>
    )
}
