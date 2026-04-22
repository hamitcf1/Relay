import { useLanguageStore } from '@/stores/languageStore'
import { NoteItem } from './NoteItem'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import type { ShiftNote, StaffMember, Hotel } from '@/types'

interface NoteListProps {
    notes: ShiftNote[]
    hotelId: string
    hotel: Hotel | null
    staff: StaffMember[]
}

export function NoteList({ notes, hotelId, hotel, staff }: NoteListProps) {
    const { t } = useLanguageStore()

    if (notes.length === 0) {
        return (
            <p className="text-muted-foreground text-sm text-center py-8">
                {t('notes.noNotes') as string}
            </p>
        )
    }

    return (
        <div className="space-y-2 md:max-h-[500px] md:overflow-y-auto custom-scrollbar relative">
            {notes.map((note) => (
                <NoteItem
                    key={note.id}
                    note={note}
                    hotelId={hotelId}
                    hotel={hotel}
                    staff={staff}
                />
            ))}
            <ScrollToTopButton />
        </div>
    )
}
