import { ChevronRight, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { ShiftNote } from '@/types'

export function HandoverSummary({ notes, copy, onOpen }: { notes: ShiftNote[]; copy: Record<string, string>; onOpen: () => void }) {
    const handoverNotes = notes.filter((note) => note.category === 'handover' || note.is_pinned).slice(0, 4)
    return (
        <section aria-labelledby="handover-title" className="cyber-card p-4 sm:p-5">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.15)]">
                        <RefreshCw className="size-4" />
                    </span>
                    <div>
                        <h2 id="handover-title" className="text-base font-bold tracking-tight">{copy.handover}</h2>
                        <p className="text-xs text-muted-foreground">{copy.handoverDescription}</p>
                    </div>
                </div>
                <button onClick={onOpen} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline transition-all">
                    {copy.openHandover}<ChevronRight className="size-4" />
                </button>
            </header>
            {handoverNotes.length ? (
                <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                    {handoverNotes.map((note) => (
                        <button
                            key={note.id}
                            onClick={onOpen}
                            className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 backdrop-blur-md px-3.5 py-3 text-left transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-md"
                        >
                            <span className="min-w-0">
                                <strong className="block truncate text-sm font-semibold text-foreground">{note.content}</strong>
                                <small className="mt-1 block text-xs text-muted-foreground font-medium">
                                    {note.room_number ? `${copy.room} ${note.room_number}` : note.created_by_name}
                                </small>
                            </span>
                            <time className="shrink-0 text-xs tabular-nums text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                {format(note.updated_at || note.created_at, 'HH:mm')}
                            </time>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="mt-4 rounded-xl bg-muted/30 border border-border/50 px-4 py-5 text-center text-sm font-medium text-muted-foreground">
                    {copy.noHandover}
                </p>
            )}
        </section>
    )
}
