import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ShiftSelector({ staffName, dayLabel, value, shifts, getLabel, getTone, onSelect, onClose }: { staffName: string; dayLabel: string; value: string | null; shifts: string[]; getLabel: (shift: string) => string; getTone: (shift: string) => string; onSelect: (shift: string | null) => void; onClose: () => void }) {
    return <div className="fixed inset-0 z-[100] flex items-end bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section role="dialog" aria-modal="true" aria-labelledby="shift-selector-title" className="w-full rounded-2xl border border-border/70 bg-popover p-4 shadow-2xl sm:max-w-sm">
            <header className="flex items-start justify-between gap-4"><div><h2 id="shift-selector-title" className="font-semibold">{staffName}</h2><p className="mt-0.5 text-sm text-muted-foreground">{dayLabel}</p></div><button aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button></header>
            <div className="mt-4 grid gap-2">{shifts.map((shift) => <button key={shift} onClick={() => onSelect(shift)} className={cn('flex min-h-12 items-center gap-3 rounded-xl border px-3 text-left transition-colors hover:border-primary/40', getTone(shift))}><span className="grid size-8 place-items-center rounded-lg bg-background/55 text-xs font-bold">{shift}</span><span className="flex-1 text-sm font-medium">{getLabel(shift)}</span>{value === shift && <Check className="size-4" />}</button>)}<button onClick={() => onSelect(null)} className="flex min-h-12 items-center gap-3 rounded-xl border border-border/60 px-3 text-left text-muted-foreground hover:bg-muted"><span className="grid size-8 place-items-center rounded-lg bg-muted text-sm">—</span><span className="flex-1 text-sm font-medium">Empty</span>{value === null && <Check className="size-4" />}</button></div>
        </section>
    </div>
}
