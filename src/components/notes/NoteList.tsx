import { useLanguageStore } from '@/stores/languageStore'
import { NoteItem } from './NoteItem'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import type { ShiftNote, StaffMember, Hotel } from '@/types'

interface NoteListProps {
    notes: ShiftNote[]
    hotelId: string
    hotel: Hotel | null
    staff: StaffMember[]
    selectedIds?: string[]
    onToggleSelectNote?: (id: string) => void
}

export function NoteList({ notes, hotelId, hotel, staff, selectedIds = [], onToggleSelectNote }: NoteListProps) {
    const { t } = useLanguageStore()

    if (notes.length === 0) {
        return (
            <p className="text-muted-foreground text-sm text-center py-8">
                {t('notes.noNotes') as string}
            </p>
        )
    }

    return (
        <div className="handover-list custom-scrollbar relative">
            {notes.map((note) => (
                <NoteItem
                    key={note.id}
                    note={note}
                    hotelId={hotelId}
                    hotel={hotel}
                    staff={staff}
                    selected={selectedIds.includes(note.id)}
                    onToggleSelect={onToggleSelectNote ? () => onToggleSelectNote(note.id) : undefined}
                />
            ))}
            <ScrollToTopButton />
        </div>
    )
}
