import type { ModuleId } from '@/config/moduleRegistry'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { CurrencyWidget } from '@/components/dashboard/CurrencyWidget'
import { StaffMealCard } from '@/components/hotel/StaffMealCard'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { BlacklistModule } from '@/components/dashboard/BlacklistModule'

interface ModuleContentProps {
    moduleId: ModuleId
    hotelId: string
    canEdit: boolean
    initialAddOpen?: boolean
}

export function ModuleContent({ moduleId, hotelId, canEdit, initialAddOpen }: ModuleContentProps) {
    if (moduleId === 'notes') return <ShiftNotes hotelId={hotelId} initialAddOpen={initialAddOpen} />
    if (moduleId === 'roster') return <RosterMatrix hotelId={hotelId} canEdit={canEdit} />
    if (moduleId === 'hotel-info') return <HotelInfoPanel hotelId={hotelId} canEdit={canEdit} />
    if (moduleId === 'currency') return <CurrencyWidget />
    if (moduleId === 'menu') return <StaffMealCard hotelId={hotelId} canEdit={canEdit} />
    if (moduleId === 'calendar') return <CalendarWidget hotelId={hotelId} />
    if (moduleId === 'blacklist') return <BlacklistModule hotelId={hotelId} />
    return null
}
