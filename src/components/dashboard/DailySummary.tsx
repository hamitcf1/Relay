import { Banknote, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList } from 'lucide-react'

export function DailySummary({ activeCount, saleCount, collectedCount, awaitingCount, copy, onOpenSales }: { activeCount: number; saleCount: number; collectedCount: number; awaitingCount: number; copy: Record<string, string>; onOpenSales: () => void }) {
    const rows = [
        { label: copy.openRecords, value: activeCount, Icon: ClipboardList, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
        { label: copy.sales, value: saleCount, Icon: CircleDollarSign, tone: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
        { label: copy.collected, value: collectedCount, Icon: CheckCircle2, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        { label: copy.awaiting, value: awaitingCount, Icon: Banknote, tone: awaitingCount ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'text-muted-foreground bg-muted/60 border-border/40' }
    ]
    return (
        <section aria-labelledby="daily-status-title" className="cyber-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 id="daily-status-title" className="text-base font-bold tracking-tight">{copy.today}</h2>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <button onClick={onOpenSales} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-all">
                    {copy.openSales}<ChevronRight className="size-4" />
                </button>
            </div>
            <div className="mt-4 divide-y divide-border/50">
                {rows.map(({ label, value, Icon, tone }) => (
                    <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 px-1 transition-colors hover:bg-muted/30 rounded-lg">
                        <span className={`grid size-9 place-items-center rounded-xl border ${tone}`}>
                            <Icon className="size-4" />
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{label}</span>
                        <strong className="text-lg font-bold tabular-nums text-foreground">{value}</strong>
                    </div>
                ))}
            </div>
        </section>
    )
}
