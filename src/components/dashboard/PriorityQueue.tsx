import { AlertTriangle, Banknote, CheckCircle2, ChevronRight, Pin } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { PriorityQueueItem } from './priorityQueueBuilder'

export function PriorityQueue({ items, copy, onOpenNotes, onOpenSales }: { items: PriorityQueueItem[]; copy: Record<string, string>; onOpenNotes: () => void; onOpenSales: () => void }) {
    return <section aria-labelledby="priority-work-title" className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-4 sm:px-5"><div><h2 id="priority-work-title" className="text-base font-semibold tracking-tight">{copy.priority}</h2><p className="mt-0.5 text-xs text-muted-foreground">{copy.priorityDescription}</p></div><button onClick={onOpenNotes} className="shrink-0 text-xs font-semibold text-primary hover:underline">{copy.allRecords}</button></header>
        {items.length ? <div className="divide-y divide-border/60">{items.slice(0, 7).map((item) => {
            const Icon = item.label === 'pinned' ? Pin : item.label === 'payment' ? Banknote : AlertTriangle
            const meta = item.meta.startsWith('room:') ? `${copy.room} ${item.meta.slice(5)}` : item.meta || copy.team
            return <button key={item.id} onClick={item.target === 'sales' ? onOpenSales : onOpenNotes} className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/45 sm:px-5"><span className={cn('grid size-9 place-items-center rounded-xl border', item.label === 'critical' ? 'border-destructive/25 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary/10 text-primary')}><Icon className="size-4" /></span><span className="min-w-0"><span className="flex items-center gap-2"><strong className="truncate text-sm font-medium">{item.title}</strong><span className={cn('hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline', item.label === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>{copy[item.label]}</span></span><span className="mt-1 flex gap-2 text-xs text-muted-foreground"><span>{meta}</span><span aria-hidden="true">·</span><span>{copy.updated} {format(item.time, 'HH:mm')}</span></span></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></button>
        })}</div> : <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center"><span className="grid size-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-5" /></span><p className="mt-3 text-sm font-medium">{copy.clear}</p></div>}
    </section>
}
