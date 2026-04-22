import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-lg bg-muted/60", className)}
            {...props}
        />
    )
}

/**
 * Page-level skeleton for lazy-loaded routes.
 * Shows a header + content area shimmer pattern.
 */
function PageSkeleton() {
    return (
        <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
            {/* Header skeleton */}
            <div className="border-b border-border/40 bg-background/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-2 w-28" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-32 h-8 rounded-xl" />
                </div>
            </div>
            {/* Content skeleton */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-40" />
                    <CardSkeleton />
                    <CardSkeleton rows={4} />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <CardSkeleton rows={3} />
                    <CardSkeleton rows={2} />
                </div>
            </div>
        </div>
    )
}

/**
 * Card-level skeleton for individual content sections.
 */
function CardSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Note-level skeleton for ShiftNotes loading state.
 */
function NotesSkeleton() {
    return (
        <div className="space-y-3">
            {/* Filter bar */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-7 flex-1 rounded" />
                ))}
            </div>
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                ))}
            </div>
            {/* Note items */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/30 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export { Skeleton, PageSkeleton, CardSkeleton, NotesSkeleton }
