import { ChevronRight, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { ShiftNote } from '@/types'

export function HandoverSummary({ notes, copy, onOpen }: { notes: ShiftNote[]; copy: Record<string, string>; onOpen: () => void }) {
    const handoverNotes = notes.filter((note) => note.category === 'handover' || note.is_pinned).slice(0, 4)
    return <section aria-labelledby="handover-title" className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"><header className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground"><RefreshCw className="size-4" /></span><div><h2 id="handover-title" className="text-base font-semibold tracking-tight">{copy.handover}</h2><p className="text-xs text-muted-foreground">{copy.handoverDescription}</p></div></div><button onClick={onOpen} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">{copy.openHandover}<ChevronRight className="size-4" /></button></header>
        {handoverNotes.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{handoverNotes.map((note) => <button key={note.id} onClick={onOpen} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3 text-left hover:border-primary/30 hover:bg-muted/35"><span className="min-w-0"><strong className="block truncate text-sm font-medium">{note.content}</strong><small className="mt-1 block text-xs text-muted-foreground">{note.room_number ? `${copy.room} ${note.room_number}` : note.created_by_name}</small></span><time className="shrink-0 text-xs tabular-nums text-muted-foreground">{format(note.updated_at || note.created_at, 'HH:mm')}</time></button>)}</div> : <p className="mt-4 rounded-xl bg-muted/35 px-4 py-5 text-center text-sm text-muted-foreground">{copy.noHandover}</p>}
    </section>
}
