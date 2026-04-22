import { useState, useMemo, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardTitle } from '@/components/ui/card'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'
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
}

export function ShiftNotes({ hotelId, showAddButton = true }: ShiftNotesProps) {
    const { notes } = useNotesStore()
    const { t } = useLanguageStore()
    const { staff, subscribeToRoster } = useRosterStore()
    const { hotel } = useHotelStore()

    // Ensure we have staff list
    useEffect(() => {
        if (hotelId) {
            const unsub = subscribeToRoster(hotelId)
            return () => unsub()
        }
    }, [hotelId, subscribeToRoster])

    const [isAdding, setIsAdding] = useState(false)
    const [statusFilter, setStatusFilter] = useState<NoteStatus | 'all'>('active')
    const [filter, setFilter] = useState<NoteCategory | 'all'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Filter notes
    const filteredNotes = useMemo(() => {
        return notes.filter((note) => {
            const matchesCategory = filter === 'all' || note.category === filter
            const matchesStatus = statusFilter === 'all' || note.status === statusFilter
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch = !searchQuery ||
                note.content.toLowerCase().includes(searchLower) ||
                (note.guest_name && note.guest_name.toLowerCase().includes(searchLower)) ||
                (note.room_number && note.room_number.toLowerCase().includes(searchLower)) ||
                (note.assigned_staff_name && note.assigned_staff_name.toLowerCase().includes(searchLower))

            return matchesCategory && matchesStatus && matchesSearch
        }).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    }, [notes, filter, statusFilter, searchQuery])

    // Calculate unread counts per category and status
    const counts = useMemo(() => {
        const c: Record<string, number> = { all: 0 }
        notes.forEach(note => {
            c[note.category] = (c[note.category] || 0) + 1
            c[note.status] = (c[note.status] || 0) + 1
            c.all++
        })
        return c
    }, [notes])

    return (
        <CollapsibleCard
            id="shift-notes"
            title={
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    📋 {t('module.shiftNotes') as string}
                    {counts.active > 0 && (
                        <Badge variant="success" className="text-[10px] h-5 py-0 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            {counts.active} {t('status.active') as string}
                        </Badge>
                    )}
                </CardTitle>
            }
            headerActions={
                showAddButton && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsAdding(!isAdding)
                        }}
                        className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                )
            }
            className="glass border-border/50"
        >
            <NoteFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                filter={filter}
                setFilter={setFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                counts={counts}
            />

            <div className="space-y-4 pt-4">
                <AnimatePresence>
                    {isAdding && (
                        <NoteForm
                            hotelId={hotelId}
                            hotel={hotel}
                            staff={staff}
                            onCancel={() => setIsAdding(false)}
                        />
                    )}
                </AnimatePresence>

                <NoteList
                    notes={filteredNotes}
                    hotelId={hotelId}
                    hotel={hotel}
                    staff={staff}
                />
            </div>
        </CollapsibleCard>
    )
}
