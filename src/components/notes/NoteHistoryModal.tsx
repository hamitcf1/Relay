import { motion } from 'framer-motion'
import { History, X, ArrowRight, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { getDateLocale, formatDisplayDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useLanguageStore } from '@/stores/languageStore'
import { categoryInfo } from '@/stores/notesStore'
import type { ShiftNote, StaffMember } from '@/types'

interface NoteHistoryModalProps {
    isOpen: boolean
    onClose: () => void
    note: ShiftNote
    staff: StaffMember[]
}

// Friendly label for each tracked field. We resolve i18n keys lazily inside
// the component so language switches propagate.
const FIELD_LABEL_KEYS: Record<string, string> = {
    content: 'notes.history.field.content',
    category: 'notes.history.field.category',
    priority: 'notes.history.field.priority',
    room_number: 'notes.history.field.room',
    amount_due: 'notes.history.field.amount',
    time: 'notes.history.field.time',
    guest_name: 'notes.history.field.guest',
    assigned_staff_uid: 'notes.history.field.assignee',
    assigned_staff_name: 'notes.history.field.assignee',
}

export function NoteHistoryModal({ isOpen, onClose, note, staff }: NoteHistoryModalProps) {
    const { t } = useLanguageStore()
    if (!isOpen) return null

    // Newest first
    const entries = [...(note.edit_history ?? [])]
        .map(e => ({ ...e, edited_at: e.edited_at instanceof Date ? e.edited_at : new Date(e.edited_at as any) }))
        .sort((a, b) => b.edited_at.getTime() - a.edited_at.getTime())

    const formatValue = (field: string, value: unknown): string => {
        if (value === null || value === undefined || value === '') return '—'
        if (field === 'category') {
            const info = categoryInfo[value as keyof typeof categoryInfo]
            return info ? info.label : String(value)
        }
        if (field === 'priority') {
            return (t(`priority.${value}` as any) as string) || String(value)
        }
        if (field === 'amount_due') {
            return typeof value === 'number' ? value.toLocaleString() : String(value)
        }
        if (field === 'assigned_staff_uid') {
            const s = staff.find(x => x.uid === value)
            return s?.name ?? String(value)
        }
        return String(value)
    }

    const getFieldLabel = (field: string): string => {
        const key = FIELD_LABEL_KEYS[field]
        return key ? (t(key as any) as string) : field
    }

    // assigned_staff_name change is redundant when uid changed — collapse it
    const visibleChanges = (changes: Record<string, { before: unknown; after: unknown }>) => {
        const entries = Object.entries(changes)
        if ('assigned_staff_uid' in changes) {
            return entries.filter(([k]) => k !== 'assigned_staff_name')
        }
        return entries
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div className="p-6 border-b border-border/40 bg-muted/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold tracking-tight">
                                {t('notes.history.title')}
                            </h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {entries.length} {entries.length === 1 ? t('notes.history.entry') : t('notes.history.entries')}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Current state preview */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                {t('notes.history.currentState')}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                · {formatDistanceToNow(note.updated_at ?? note.created_at, { addSuffix: true, locale: getDateLocale() })}
                            </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {note.content}
                        </p>
                    </div>

                    {entries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">{t('notes.history.empty')}</p>
                            <p className="text-xs opacity-60 mt-1">{t('notes.history.emptyHint')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry, i) => {
                                const editor = staff.find(s => s.uid === entry.edited_by)
                                const changes = visibleChanges(entry.changes)
                                return (
                                    <div
                                        key={`${entry.edited_at.getTime()}-${i}`}
                                        className="relative pl-8"
                                    >
                                        {/* Timeline rail */}
                                        <span className="absolute left-3 top-3 bottom-0 w-px bg-border" aria-hidden />
                                        <span className="absolute left-[7px] top-3 w-2 h-2 rounded-full bg-primary ring-4 ring-card" aria-hidden />

                                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <UserAvatar
                                                    user={{
                                                        id: entry.edited_by,
                                                        name: entry.edited_by_name,
                                                        settings: editor?.settings,
                                                    } as any}
                                                    size="sm"
                                                    className="w-6 h-6 border-none bg-transparent shadow-none"
                                                />
                                                <span className="text-sm font-semibold">{entry.edited_by_name}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1" title={formatDisplayDateTime(entry.edited_at)}>
                                                    <Clock className="w-3 h-3" />
                                                    {format(entry.edited_at, 'd MMM yyyy · HH:mm', { locale: getDateLocale() })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    {formatDistanceToNow(entry.edited_at, { addSuffix: true, locale: getDateLocale() })}
                                                </span>
                                            </div>

                                            {changes.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">{t('notes.history.noVisibleChanges')}</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {changes.map(([field, { before, after }]) => (
                                                        <li key={field} className="text-xs">
                                                            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                                                                {getFieldLabel(field)}
                                                            </span>
                                                            <div className="mt-1 flex items-start gap-2">
                                                                <DiffPill value={formatValue(field, before)} variant="before" />
                                                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1.5" />
                                                                <DiffPill value={formatValue(field, after)} variant="after" />
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/10 border-t border-border/40 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-xl">
                        {t('common.close')}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}

function DiffPill({ value, variant }: { value: string; variant: 'before' | 'after' }) {
    const isLong = value.length > 80
    return (
        <span
            className={
                variant === 'before'
                    ? 'flex-1 min-w-0 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs break-words whitespace-pre-wrap line-through decoration-rose-500/40'
                    : 'flex-1 min-w-0 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs break-words whitespace-pre-wrap'
            }
            style={isLong ? { maxHeight: '120px', overflowY: 'auto' } : undefined}
        >
            {value}
        </span>
    )
}
