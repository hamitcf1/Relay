import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Clock3, Pin, Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useNotesStore, type NoteCategory, type NoteStatus } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useHotelStore } from '@/stores/hotelStore'

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
    const language = useLanguageStore((state) => state.language)
    const { activeStaff, subscribeToRoster } = useRosterStore()
    const hotel = useHotelStore((state) => state.hotel)

    useEffect(() => {
        if (!hotelId) return
        return subscribeToRoster(hotelId)
    }, [hotelId, subscribeToRoster])

    const [isAdding, setIsAdding] = useState(initialAddOpen)
    const [statusFilter, setStatusFilter] = useState<NoteStatus | 'all'>('active')
    const [filter, setFilter] = useState<NoteCategory | 'all'>('all')
    const [searchQuery, setSearchQuery] = useState('')

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

            <div className="handover-workspace__board">
                <NoteList notes={visibleNotes} hotelId={hotelId} hotel={hotel} staff={activeStaff} />
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
