import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Clock, Eye, Loader2, Plus, Wrench } from 'lucide-react'
import { format, isBefore, startOfDay } from 'date-fns'

import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useNotesStore } from '@/stores/notesStore'
import { useRosterStore } from '@/stores/rosterStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { NotePriority, NoteStatus, ShiftNote } from '@/types'

/**
 * The maintenance queue.
 *
 * ## Why this sits on notes rather than on the `logs` collection
 *
 * A `logs` collection exists, has types, a store and Firestore rules, and nothing renders it. It
 * was the obvious home for this and it is the wrong one: reviving it would mean a second copy of
 * the note lifecycle to keep in step, and a second place for a shift handover to have to remember
 * to write to. A maintenance ticket is a note that somebody has to act on, so it is a note, in the
 * `maintenance` category, exactly as a complaint is a note in the `feedback` category.
 *
 * ## What makes it a queue and not a list of notes
 *
 * A list is sorted by date. A queue is sorted by what is going to hurt if it is left: overdue
 * first, then critical, then the rest. Three things make that possible and `logs` had none of
 * them, so they are the fields this adds — `due_at` for when it should be done by, which is not
 * the same as when somebody noticed, and `assigned_staff_uid` for who is doing it, which already
 * existed on notes for other reasons. `resolution` is what was actually done, kept apart from
 * `content` so that "reported broken" and "pump replaced" stay readable next to each other.
 *
 * ## Who can do what
 *
 * Everyone can report a problem, because the person who notices a broken lift is not always the
 * person who can fix it, and a queue that only accepts reports from managers is a queue that
 * misses reports. Assigning and closing are narrower: closing writes a permanent record of work
 * done, so it is for managers.
 */

type Filter = 'open' | 'resolved' | 'all'

const PRIORITY_ORDER: Record<NotePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
}

export function MaintenanceQueue() {
    const { t } = useLanguageStore()
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { notes, subscribeToNotes, addNote, updateNote, updateNoteStatus, loading } = useNotesStore()
    const activeStaff = useRosterStore((state) => state.activeStaff)

    const [filter, setFilter] = useState<Filter>('open')
    const [room, setRoom] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<NotePriority>('medium')
    const [due, setDue] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resolving, setResolving] = useState<string | null>(null)
    const [resolution, setResolution] = useState('')

    const isGM = user?.role === 'gm'

    useEffect(() => {
        if (!hotel?.id) return
        return subscribeToNotes(hotel.id)
    }, [hotel?.id, subscribeToNotes])

    const tickets = useMemo(() => notes.filter((n) => n.category === 'maintenance'), [notes])

    const visible = useMemo(() => {
        // A deleted note is not a closed ticket. Without this it would surface under "closed",
        // where a manager would read it as work that had been done.
        const live = tickets.filter((n) => n.status !== 'trash')
        const filtered = filter === 'all'
            ? live
            : live.filter((n) => (filter === 'open'
                ? n.status === 'active'
                : n.status === 'resolved' || n.status === 'archived'))

        // Overdue first, then priority, then oldest. A ticket nobody has touched for a week at low
        // priority should not sit above a critical one reported ten minutes ago.
        return [...filtered].sort((a, b) => {
            const today = startOfDay(new Date())
            const aOver = a.due_at && isBefore(a.due_at, today)
            const bOver = b.due_at && isBefore(b.due_at, today)
            if (aOver !== bOver) return aOver ? -1 : 1
            const aPri = PRIORITY_ORDER[a.priority ?? 'low']
            const bPri = PRIORITY_ORDER[b.priority ?? 'low']
            if (aPri !== bPri) return aPri - bPri
            return b.created_at.getTime() - a.created_at.getTime()
        })
    }, [tickets, filter])

    const openCount = tickets.filter((n) => n.status === 'active').length
    // Counted rather than derived from the visible list, so the badge does not change when the
    // filter does. A manager looking at "closed" still needs to know two are open.
    const overdueCount = tickets.filter((n) => n.status === 'active' && n.due_at && isBefore(n.due_at, startOfDay(new Date()))).length

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim() || !hotel?.id || !user) return

        setSubmitting(true)
        try {
            await addNote(hotel.id, {
                category: 'maintenance',
                content: description.trim(),
                room_number: room.trim() || null,
                priority,
                is_relevant: false,
                amount_due: null,
                is_paid: false,
                created_by: user.uid,
                created_by_name: user.name,
                shift_id: null,
                due_at: due ? new Date(`${due}T12:00:00`) : null,
            })
            setDescription('')
            setRoom('')
            setDue('')
            setPriority('medium')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAssign = async (ticket: ShiftNote, uid: string) => {
        if (!hotel?.id) return
        const member = activeStaff.find((s) => s.uid === uid)
        await updateNote(hotel.id, ticket.id, {
            assigned_staff_uid: uid,
            assigned_staff_name: member?.name ?? null,
        })
    }

    /**
     * Closing a ticket writes what was done. The note is left as it was, so the report and the
     * fix sit next to each other instead of one overwriting the other.
     */
    const handleResolve = async (ticket: ShiftNote) => {
        if (!hotel?.id || !user) return
        const text = resolution.trim()
        await updateNoteStatus(hotel.id, ticket.id, 'resolved', user.uid)
        if (text) {
            await updateNote(hotel.id, ticket.id, { resolution: text })
        }
        setResolving(null)
        setResolution('')
    }

    const handleReopen = async (ticket: ShiftNote) => {
        if (!hotel?.id) return
        await updateNoteStatus(hotel.id, ticket.id, 'active')
    }

    return (
        <section className="mx-auto w-full max-w-[82rem] space-y-6" data-testid="maintenance-queue">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{t('maintenance.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('maintenance.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {overdueCount > 0 && (
                        <Badge className="border-red-500/30 bg-red-500/10 text-red-500" data-testid="overdue-count">
                            {t('maintenance.overdueCount').replace('{count}', String(overdueCount))}
                        </Badge>
                    )}
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary" data-testid="open-count">
                        {t('maintenance.openCount').replace('{count}', String(openCount))}
                    </Badge>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)]">
                <div className="space-y-4">
                    <div className="flex gap-1 rounded-lg bg-muted/50 p-1" role="group" aria-label={t('maintenance.filter.label')}>
                        {(['open', 'resolved', 'all'] as Filter[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(value)}
                                aria-pressed={filter === value}
                                className={cn(
                                    'flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                                    filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {t(`maintenance.filter.${value}` as const)}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : visible.length === 0 ? (
                        <p className="rounded-xl border border-border bg-card/40 py-10 text-center text-sm text-muted-foreground">
                            {t(filter === 'resolved' ? 'maintenance.emptyResolved' : filter === 'all' ? 'maintenance.emptyAll' : 'maintenance.emptyOpen')}
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {visible.map((ticket) => (
                                <TicketRow
                                    key={ticket.id}
                                    ticket={ticket}
                                    isGM={isGM}
                                    activeStaff={activeStaff}
                                    resolving={resolving === ticket.id}
                                    resolution={resolution}
                                    onResolutionChange={setResolution}
                                    onStartResolving={() => { setResolving(ticket.id); setResolution('') }}
                                    onCancelResolving={() => setResolving(null)}
                                    onResolve={() => handleResolve(ticket)}
                                    onReopen={() => handleReopen(ticket)}
                                    onAssign={(uid) => handleAssign(ticket, uid)}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                <Card className="h-fit border-border bg-card/50">
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
                            <h3 className="text-sm font-bold text-foreground">{t('maintenance.report.title')}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="maintenance-room" className="text-xs text-muted-foreground">{t('maintenance.room')}</Label>
                                <Input
                                    id="maintenance-room"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                    placeholder={t('maintenance.roomPlaceholder')}
                                    className="h-9 bg-muted/50 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="maintenance-description" className="text-xs text-muted-foreground">{t('maintenance.what')}</Label>
                                <Textarea
                                    id="maintenance-description"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('maintenance.whatPlaceholder')}
                                    className="min-h-24 resize-y bg-muted/50 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('maintenance.priority')}</Label>
                                    <Select value={priority} onValueChange={(v) => setPriority(v as NotePriority)}>
                                        <SelectTrigger className="h-9 bg-muted/50 text-xs" aria-label={t('maintenance.priority')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(['critical', 'high', 'medium', 'low'] as NotePriority[]).map((value) => (
                                                <SelectItem key={value} value={value}>{t(`priority.${value}` as const)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="maintenance-due" className="text-xs text-muted-foreground">{t('maintenance.due')}</Label>
                                    <Input
                                        id="maintenance-due"
                                        type="date"
                                        value={due}
                                        onChange={(e) => setDue(e.target.value)}
                                        className="h-9 bg-muted/50 text-xs"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting || !description.trim()}
                                className="h-10 w-full gap-2"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                                {t('maintenance.report.submit')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

interface TicketRowProps {
    ticket: ShiftNote
    isGM: boolean
    activeStaff: Array<{ uid: string; name: string }>
    resolving: boolean
    resolution: string
    onResolutionChange: (value: string) => void
    onStartResolving: () => void
    onCancelResolving: () => void
    onResolve: () => void
    onReopen: () => void
    onAssign: (uid: string) => void
}

function TicketRow({
    ticket, isGM, activeStaff, resolving, resolution,
    onResolutionChange, onStartResolving, onCancelResolving, onResolve, onReopen, onAssign,
}: TicketRowProps) {
    const { t } = useLanguageStore()

    const overdue = ticket.status === 'active' && !!ticket.due_at && isBefore(ticket.due_at, startOfDay(new Date()))
    const pri = ticket.priority ?? 'low'

    return (
        <li
            className={cn(
                'space-y-3 rounded-xl border bg-card/60 p-4',
                overdue ? 'border-red-500/40' : 'border-border',
                ticket.status !== 'active' && 'opacity-70'
            )}
            data-testid="maintenance-ticket"
        >
            <div className="flex flex-wrap items-center gap-2">
                <Badge
                    className={cn(
                        'text-[10px]',
                        pri === 'critical' ? 'bg-red-500/15 text-red-500 border-red-500/25'
                            : pri === 'high' ? 'bg-amber-500/15 text-amber-500 border-amber-500/25'
                                : 'bg-muted text-muted-foreground'
                    )}
                >
                    {t(`priority.${pri}` as const)}
                </Badge>

                {ticket.room_number && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground">
                        {t('maintenance.roomLabel').replace('{room}', ticket.room_number)}
                    </span>
                )}

                <StatusBadge status={ticket.status} />

                {overdue && (
                    <Badge className="bg-red-500/15 text-[10px] text-red-500 border-red-500/25" data-testid="overdue-badge">
                        {t('maintenance.overdue')}
                    </Badge>
                )}

                <span className="ml-auto text-[10px] text-muted-foreground">
                    {format(ticket.created_at, 'd MMM yyyy')}
                </span>
            </div>

            <p className="text-sm leading-relaxed text-foreground">{ticket.content}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                {ticket.due_at && (
                    <span className={cn('flex items-center gap-1', overdue && 'font-semibold text-red-500')} data-testid="ticket-due">
                        <CalendarClock className="h-3 w-3" aria-hidden="true" />
                        {t('maintenance.dueOn').replace('{date}', format(ticket.due_at, 'd MMM'))}
                    </span>
                )}
                <span>{t('maintenance.reportedBy').replace('{name}', ticket.created_by_name)}</span>
            </div>

            {ticket.resolution && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-foreground" data-testid="ticket-resolution">
                    <span className="font-semibold text-emerald-500">{t('maintenance.resolutionLabel')}</span>{' '}
                    {ticket.resolution}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Select
                    value={ticket.assigned_staff_uid ?? 'unassigned'}
                    onValueChange={(v) => onAssign(v)}
                    disabled={!isGM}
                >
                    <SelectTrigger
                        className="h-8 w-44 bg-background text-xs"
                        aria-label={t('maintenance.assign')}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unassigned">{t('maintenance.unassigned')}</SelectItem>
                        {activeStaff.map((member) => (
                            <SelectItem key={member.uid} value={member.uid}>{member.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {ticket.status === 'active' ? (
                    isGM ? (
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onStartResolving}>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('maintenance.resolve')}
                        </Button>
                    ) : (
                        <span className="text-[11px] italic text-muted-foreground">{t('maintenance.gmOnly')}</span>
                    )
                ) : (
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={onReopen}>
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('maintenance.reopen')}
                    </Button>
                )}
            </div>

            {resolving && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <Label htmlFor={`resolution-${ticket.id}`} className="text-xs text-muted-foreground">
                        {t('maintenance.resolutionLabel')}
                    </Label>
                    <Textarea
                        id={`resolution-${ticket.id}`}
                        value={resolution}
                        onChange={(e) => onResolutionChange(e.target.value)}
                        placeholder={t('maintenance.resolutionPlaceholder')}
                        className="min-h-16 resize-y bg-background text-xs"
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancelResolving}>
                            {t('common.cancel')}
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={onResolve}>
                            {t('maintenance.confirmResolve')}
                        </Button>
                    </div>
                </div>
            )}
        </li>
    )
}

function StatusBadge({ status }: { status: NoteStatus }) {
    const { t } = useLanguageStore()

    const config: Record<NoteStatus, { label: string; icon: typeof Clock; className: string }> = {
        active: { label: t('status.active'), icon: Clock, className: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
        resolved: { label: t('status.resolved'), icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
        archived: { label: t('status.archived'), icon: Eye, className: 'bg-muted text-muted-foreground' },
        // A deleted note is filtered out of the queue rather than shown, so this never renders. It
        // is here because the record is keyed by NoteStatus, which carries a fourth member, and a
        // map that is not complete fails to compile when the type grows. That is the point.
        trash: { label: t('status.archived'), icon: Eye, className: 'bg-muted text-muted-foreground' },
    }

    const Icon = config[status].icon
    return (
        <Badge className={cn('gap-1 border text-[10px]', config[status].className)}>
            <Icon className="h-2.5 w-2.5" aria-hidden="true" />
            {config[status].label}
        </Badge>
    )
}
