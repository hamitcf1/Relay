import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Clock3, Pin, Plus, ChevronDown, ChevronUp, BarChart2, NotebookPen } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNotesStore, type NoteCategory, type NoteStatus } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

import { NoteFilters } from './NoteFilters'
import { NoteList } from './NoteList'
import { NewNoteModal } from './NewNoteModal'
import { ShiftHandoverPdfModal } from './ShiftHandoverPdfModal'
import { PersonalNotes } from './PersonalNotes'

interface ShiftNotesProps {
    hotelId: string
    showAddButton?: boolean
    initialAddOpen?: boolean
    initialTab?: 'handover' | 'personal'
}

export function ShiftNotes({ hotelId, showAddButton = true, initialAddOpen = false, initialTab = 'handover' }: ShiftNotesProps) {
    const [mainTab, setMainTab] = useState<'handover' | 'personal'>(initialTab)
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
    const [showPdfModal, setShowPdfModal] = useState(false)
    const [showMetricsGrid, setShowMetricsGrid] = useState(false)

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

    if (mainTab === 'personal') {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <button
                        onClick={() => setMainTab('handover')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                        <span>{language === 'tr' ? 'Ortak Vardiya Devri' : language === 'ru' ? 'Смена' : 'Shift Handover'}</span>
                    </button>
                    <button
                        onClick={() => setMainTab('personal')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-md transition-colors"
                    >
                        <NotebookPen className="w-4 h-4" />
                        <span>{language === 'tr' ? 'Kişisel Notlarım' : language === 'ru' ? 'Личные заметки' : 'Personal Notes'}</span>
                    </button>
                </div>
                <PersonalNotes hotelId={hotelId} />
            </div>
        )
    }

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
        if (!hotelId || user?.role !== 'gm') return
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
        <div className="space-y-4">
            {/* CONTROL BAR - RELATIVE ON MOBILE, STICKY ON DESKTOP */}
            <div className="relative z-10 md:sticky md:top-0 md:z-30 bg-background/95 backdrop-blur-xl border-b border-border/60 pb-3 pt-2 shadow-xs transition-all -mx-3 px-3 sm:-mx-6 sm:px-6">
                {/* Row 1: Page Identity + Inline Metrics Strip + Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 max-w-full overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 shrink-0">
                            <button
                                onClick={() => setMainTab('handover')}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
                                    mainTab === 'handover' ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ArrowLeftRight className="size-3.5" />
                                <span className="whitespace-nowrap">{language === 'tr' ? 'Ortak Vardiya Logu' : 'Handover Log'}</span>
                            </button>
                            <button
                                onClick={() => setMainTab('personal')}
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all shrink-0"
                            >
                                <NotebookPen className="size-3.5" />
                                <span className="whitespace-nowrap">{language === 'tr' ? 'Kişisel Notlarım' : 'Personal Notes'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Inline Compact Metric Badges */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full shrink-0">
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all select-none shrink-0",
                                statusFilter === 'active'
                                    ? "bg-sky-500/15 border-sky-500/40 text-sky-400 font-semibold"
                                    : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                            title={copy.active}
                        >
                            <Clock3 className="size-3.5 text-sky-400" />
                            <span className="font-bold tabular-nums text-foreground">{metrics.active}</span>
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">{copy.active}</span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('active')}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all select-none shrink-0",
                                metrics.critical > 0
                                    ? "bg-rose-500/15 border-rose-500/40 text-rose-400 font-semibold animate-pulse"
                                    : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/80"
                            )}
                            title={copy.critical}
                        >
                            <AlertTriangle className="size-3.5 text-rose-400" />
                            <span className="font-bold tabular-nums text-rose-400">{metrics.critical}</span>
                            <span className="text-[11px] text-rose-400/80 hidden sm:inline">{copy.critical}</span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('active')}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all select-none shrink-0"
                            title={copy.pinned}
                        >
                            <Pin className="size-3.5 text-amber-400" />
                            <span className="font-bold tabular-nums text-foreground">{metrics.pinned}</span>
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">{copy.pinned}</span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('resolved')}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all select-none shrink-0",
                                statusFilter === 'resolved'
                                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold"
                                    : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                            title={copy.completed}
                        >
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                            <span className="font-bold tabular-nums text-foreground">{metrics.completed}</span>
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">{copy.completed}</span>
                        </button>

                        {/* Collapsible Stat Grid Toggle Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMetricsGrid(prev => !prev)}
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0"
                            title={showMetricsGrid ? "İstatistikleri Gizle" : "İstatistikleri Genişlet"}
                        >
                            <BarChart2 className="size-3.5" />
                            {showMetricsGrid ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                        </Button>
                    </div>

                    {/* Add Note Button */}
                    {showAddButton && (
                        <Button
                            onClick={() => setIsAdding((open) => !open)}
                            aria-expanded={isAdding}
                            size="sm"
                            className="h-8 px-3 text-xs font-bold gap-1.5 rounded-lg bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all ml-auto sm:ml-0 shrink-0"
                        >
                            <Plus className="size-3.5" />
                            <span>{copy.add}</span>
                        </Button>
                    )}
                </div>

                {/* Optional Expanded Stat Cards Grid */}
                <AnimatePresence>
                    {showMetricsGrid && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mb-3"
                        >
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 pb-2">
                                <HandoverMetric icon={Clock3} value={metrics.active} label={copy.active} tone="sky" />
                                <HandoverMetric icon={AlertTriangle} value={metrics.critical} label={copy.critical} tone="critical" />
                                <HandoverMetric icon={Pin} value={metrics.pinned} label={copy.pinned} tone="amber" />
                                <HandoverMetric icon={CheckCircle2} value={metrics.completed} label={copy.completed} tone="success" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Row 2: Integrated Filter & Search Toolbar */}
                <NoteFilters
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    filter={filter}
                    setFilter={setFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    counts={counts}
                    selectedCount={selectedNoteIds.length}
                    totalCount={visibleNotes.length}
                    onToggleSelectAll={handleToggleSelectAll}
                    onPrintPdf={() => setShowPdfModal(true)}
                    onEmptyTrash={handleEmptyTrash}
                    isGM={user?.role === 'gm'}
                    onBulkStatus={handleBulkStatusChange}
                    onBulkDelete={handleBulkDelete}
                />
            </div>

            {/* New Note Modal */}
            <NewNoteModal
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                hotelId={hotelId}
                hotel={hotel}
                staff={activeStaff}
            />

            {/* Note List Container - Single Natural Scroll Flow */}
            <NoteList
                notes={visibleNotes}
                hotelId={hotelId}
                hotel={hotel}
                staff={activeStaff}
                selectedIds={selectedNoteIds}
                onToggleSelectNote={handleToggleSelectNote}
            />

            {showPdfModal && (
                <ShiftHandoverPdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    notes={visibleNotes}
                />
            )}
        </div>
    )
}

function HandoverMetric({ icon: Icon, value, label, tone }: { icon: any; value: number; label: string; tone?: 'critical' | 'amber' | 'success' | 'sky' }) {
    const toneStyles = tone === 'critical'
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
        : tone === 'amber'
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
            : tone === 'success'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'text-sky-400 bg-sky-500/10 border-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.15)]'

    return (
        <div className="cyber-card-interactive p-3 flex items-center gap-3">
            <span className={`grid size-8 place-items-center rounded-lg border shrink-0 ${toneStyles}`}>
                <Icon className="size-4" />
            </span>
            <div className="flex flex-col">
                <strong className="text-xl font-bold font-mono tabular-nums leading-tight text-foreground">{value}</strong>
                <span className="text-[11px] font-medium text-muted-foreground/80">{label}</span>
            </div>
        </div>
    )
}

