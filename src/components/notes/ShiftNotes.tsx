import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Clock3, Pin, Plus, Trash2, Archive, CheckSquare, Square, RotateCcw, Check } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useNotesStore, type NoteCategory, type NoteStatus } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'

import { NoteFilters } from './NoteFilters'
import { NoteForm } from './NoteForm'
import { NoteList } from './NoteList'

interface ShiftNotesProps {
    hotelId: string
    showAddButton?: boolean
    initialAddOpen?: boolean
}

export function ShiftNotes({ hotelId, showAddButton = true, initialAddOpen = false }: ShiftNotesProps) {
    const notes = useNotesStore((state) => state.notes)
    const { bulkUpdateNoteStatus, bulkDeleteNotes, emptyTrash } = useNotesStore()
    const language = useLanguageStore((state) => state.language)
    const { activeStaff, subscribeToRoster } = useRosterStore()
    const hotel = useHotelStore((state) => state.hotel)
    const user = useAuthStore((state) => state.user)
    const confirm = useConfirm()

    useEffect(() => {
        if (!hotelId) return
        return subscribeToRoster(hotelId)
    }, [hotelId, subscribeToRoster])

    const [isAdding, setIsAdding] = useState(initialAddOpen)
    const [statusFilter, setStatusFilter] = useState<NoteStatus | 'all'>('active')
    const [filter, setFilter] = useState<NoteCategory | 'all'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])

    useEffect(() => {
        if (initialAddOpen) setIsAdding(true)
    }, [initialAddOpen])

    // Clear selection when filters change
    useEffect(() => {
        setSelectedNoteIds([])
    }, [statusFilter, filter, searchQuery])

    const copy = language === 'tr'
        ? { title: 'Vardiya devri', subtitle: 'Açık işleri devral, güncelle ve sonraki vardiyaya aktar.', add: 'Devir kaydı ekle', active: 'Açık', critical: 'Acil', pinned: 'Sabit', completed: 'Bugün tamamlandı' }
        : language === 'ru'
            ? { title: 'Передача смены', subtitle: 'Примите открытые задачи, обновите их и передайте следующей смене.', add: 'Добавить запись', active: 'Открыто', critical: 'Срочно', pinned: 'Закреплено', completed: 'Завершено сегодня' }
            : { title: 'Shift handover', subtitle: 'Take over open work, update it, and pass it to the next shift.', add: 'Add handover record', active: 'Open', critical: 'Critical', pinned: 'Pinned', completed: 'Completed today' }

    const { visibleNotes, counts, metrics } = useMemo(() => {
        const searchLower = searchQuery.trim().toLowerCase()
        const matches = notes.filter((note) => {
            const matchesCategory = filter === 'all' || note.category === filter
            const matchesStatus = statusFilter === 'all' || note.status === statusFilter
            const matchesSearch = !searchLower
                || note.content.toLowerCase().includes(searchLower)
                || note.guest_name?.toLowerCase().includes(searchLower)
                || note.room_number?.toLowerCase().includes(searchLower)
                || note.assigned_staff_name?.toLowerCase().includes(searchLower)
            return matchesCategory && matchesStatus && matchesSearch
        })
        const sorted = [...matches].sort((a, b) => {
            if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1
            return b.created_at.getTime() - a.created_at.getTime()
        })
        const noteCounts: Record<string, number> = { all: 0 }
        notes.forEach((note) => {
            noteCounts[note.category] = (noteCounts[note.category] || 0) + 1
            noteCounts[note.status] = (noteCounts[note.status] || 0) + 1
            noteCounts.all++
        })
        const today = format(new Date(), 'yyyy-MM-dd')
        return {
            visibleNotes: sorted,
            counts: noteCounts,
            metrics: {
                active: notes.filter((note) => note.status === 'active').length,
                critical: notes.filter((note) => note.status === 'active' && note.priority === 'critical').length,
                pinned: notes.filter((note) => note.status === 'active' && note.is_pinned).length,
                completed: notes.filter((note) => note.resolved_at && format(note.resolved_at, 'yyyy-MM-dd') === today).length,
            },
        }
    }, [filter, notes, searchQuery, statusFilter])

    const handleToggleSelectAll = () => {
        if (selectedNoteIds.length === visibleNotes.length) {
            setSelectedNoteIds([])
        } else {
            setSelectedNoteIds(visibleNotes.map(n => n.id))
        }
    }

    const handleToggleSelectNote = (id: string) => {
        setSelectedNoteIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleBulkStatusChange = async (status: NoteStatus) => {
        if (selectedNoteIds.length === 0) return
        await bulkUpdateNoteStatus(hotelId, selectedNoteIds, status, user?.uid)
        setSelectedNoteIds([])
    }

    const handleBulkDelete = async () => {
        if (selectedNoteIds.length === 0) return
        const confirmed = await confirm({
            title: 'Seçili notlar silinsin mi?',
            description: `${selectedNoteIds.length} not kalıcı olarak silinecek.`,
            variant: 'destructive',
            confirmLabel: 'Sil'
        })
        if (confirmed) {
            await bulkDeleteNotes(hotelId, selectedNoteIds)
            setSelectedNoteIds([])
        }
    }

    const handleEmptyTrash = async () => {
        const confirmed = await confirm({
            title: 'Çöp Kutusu Temizlensin mi?',
            description: 'Çöp kutusundaki tüm notlar kalıcı olarak silinecek. Bu işlem geri alınamaz.',
            variant: 'destructive',
            confirmLabel: 'Çöp Kutusunu Temizle'
        })
        if (confirmed) {
            await emptyTrash(hotelId)
            setSelectedNoteIds([])
        }
    }

    return (
        <section className="handover-workspace">
            <header className="handover-workspace__header">
                <div className="handover-workspace__identity">
                    <span className="handover-workspace__mark"><ArrowLeftRight /></span>
                    <div><h2>{copy.title}</h2><p>{copy.subtitle}</p></div>
                </div>
                {showAddButton && (
                    <button className="handover-workspace__add" onClick={() => setIsAdding((open) => !open)} aria-expanded={isAdding}>
                        <Plus /><span>{copy.add}</span>
                    </button>
                )}
            </header>

            <div className="handover-workspace__metrics">
                <HandoverMetric icon={Clock3} value={metrics.active} label={copy.active} />
                <HandoverMetric icon={AlertTriangle} value={metrics.critical} label={copy.critical} tone="critical" />
                <HandoverMetric icon={Pin} value={metrics.pinned} label={copy.pinned} tone="amber" />
                <HandoverMetric icon={CheckCircle2} value={metrics.completed} label={copy.completed} tone="success" />
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="handover-workspace__compose">
                        <NoteForm hotelId={hotelId} hotel={hotel} staff={activeStaff} onCancel={() => setIsAdding(false)} />
                    </div>
                )}
            </AnimatePresence>

            <div className="handover-workspace__toolbar">
                <NoteFilters
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    filter={filter}
                    setFilter={setFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    counts={counts}
                />
            </div>

            {/* Bulk Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border/50 my-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToggleSelectAll} className="h-8 text-xs gap-1.5">
                        {selectedNoteIds.length > 0 && selectedNoteIds.length === visibleNotes.length ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                        {selectedNoteIds.length > 0 ? `${selectedNoteIds.length} / ${visibleNotes.length} Seçildi` : 'Tümünü Seç'}
                    </Button>
                    {statusFilter === 'trash' && (
                        <Button variant="destructive" size="sm" onClick={handleEmptyTrash} className="h-8 text-xs gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            Çöp Kutusunu Temizle
                        </Button>
                    )}
                </div>

                {selectedNoteIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-foreground mr-1">{selectedNoteIds.length} Not Seçildi:</span>
                        <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('active')} className="h-8 text-xs gap-1 text-emerald-500 hover:bg-emerald-500/10">
                            <RotateCcw className="w-3.5 h-3.5" /> Aktif Yap
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('resolved')} className="h-8 text-xs gap-1 text-blue-500 hover:bg-blue-500/10">
                            <Check className="w-3.5 h-3.5" /> Çözüldü Yap
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('archived')} className="h-8 text-xs gap-1 text-amber-500 hover:bg-amber-500/10">
                            <Archive className="w-3.5 h-3.5" /> Arşive Al
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('trash')} className="h-8 text-xs gap-1 text-rose-500 hover:bg-rose-500/10">
                            <Trash2 className="w-3.5 h-3.5" /> Çöp Kutusuna At
                        </Button>
                        {user?.role === 'gm' && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-8 text-xs gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Kalıcı Sil
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="handover-workspace__board">
                <NoteList
                    notes={visibleNotes}
                    hotelId={hotelId}
                    hotel={hotel}
                    staff={activeStaff}
                    selectedIds={selectedNoteIds}
                    onToggleSelectNote={handleToggleSelectNote}
                />
            </div>
        </section>
    )
}

function HandoverMetric({ icon: Icon, value, label, tone = 'neutral' }: {
    icon: typeof Clock3
    value: number
    label: string
    tone?: 'neutral' | 'critical' | 'amber' | 'success'
}) {
    return <div className={`handover-metric handover-metric--${tone}`}><span><Icon /></span><strong>{value}</strong><small>{label}</small></div>
}
