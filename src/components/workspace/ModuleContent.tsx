import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { ModuleId } from '@/config/moduleRegistry'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { CurrencyWidget } from '@/components/dashboard/CurrencyWidget'
import { StaffMealCard } from '@/components/hotel/StaffMealCard'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { BlacklistModule } from '@/components/dashboard/BlacklistModule'
import { CompliancePanel } from '@/components/dashboard/CompliancePanel'
import { useLanguageStore } from '@/stores/languageStore'

const MessagingPanel = lazy(() => import('@/components/messaging/MessagingPanel').then((m) => ({ default: m.MessagingPanel })))
const FeedbackSection = lazy(() => import('@/components/feedback/FeedbackSection').then((m) => ({ default: m.FeedbackSection })))
const OffDayScheduler = lazy(() => import('@/components/staff/OffDayScheduler').then((m) => ({ default: m.OffDayScheduler })))
const TourCatalogue = lazy(() => import('@/components/tours/TourCatalogue').then((m) => ({ default: m.TourCatalogue })))
const SalesPanel = lazy(() => import('@/components/sales/SalesPanel').then((m) => ({ default: m.SalesPanel })))
const PricingPanel = lazy(() => import('@/components/pricing/PricingPanel').then((m) => ({ default: m.PricingPanel })))
const LeaderboardPanel = lazy(() => import('@/components/team/LeaderboardPanel').then((m) => ({ default: m.LeaderboardPanel })))
const ActivityLogPanel = lazy(() => import('@/components/activity/ActivityLogPanel').then((m) => ({ default: m.ActivityLogPanel })))
const HotelSettings = lazy(() => import('@/components/settings/HotelSettings').then((m) => ({ default: m.HotelSettings })))
const CardsAndLoansPanel = lazy(() => import('@/components/loans/CardsAndLoansPanel').then((m) => ({ default: m.CardsAndLoansPanel })))

interface ModuleContentProps {
    moduleId: ModuleId
    hotelId: string
    canEdit: boolean
    initialAddOpen?: boolean
}

export function ModuleContent({ moduleId, hotelId, canEdit, initialAddOpen }: ModuleContentProps) {
    const { t, language } = useLanguageStore()
    if (moduleId === 'notes') return <ShiftNotes hotelId={hotelId} initialAddOpen={initialAddOpen} />
    if (moduleId === 'roster') return <RosterMatrix hotelId={hotelId} canEdit={canEdit} />
    if (moduleId === 'hotel-info') return <HotelInfoPanel hotelId={hotelId} canEdit={canEdit} />
    if (moduleId === 'currency') return <CurrencyWidget />
    if (moduleId === 'menu') return <StaffMealCard hotelId={hotelId} canEdit={canEdit} />
    if (moduleId === 'calendar') return <CalendarWidget hotelId={hotelId} />
    if (moduleId === 'blacklist') return <BlacklistModule hotelId={hotelId} />
    const content = moduleId === 'messaging' ? <MessagingPanel />
        : moduleId === 'compliance' ? <div className="mx-auto max-w-2xl space-y-6"><div><h2 className="text-2xl font-semibold">{t('module.compliance')}</h2><p className="text-sm text-muted-foreground">{language === 'tr' ? 'Güncel vardiyanın operasyon standartlarını takip edin.' : language === 'ru' ? 'Контролируйте стандарты текущей смены.' : 'Track operational standards for the current shift.'}</p></div><CompliancePanel hotelId={hotelId} /></div>
            : moduleId === 'settings' ? <HotelSettings />
                : moduleId === 'sales' ? <SalesPanel />
                    : moduleId === 'feedback' ? <FeedbackSection />
                        : moduleId === 'off-days' ? <OffDayScheduler />
                            : moduleId === 'tours' ? <TourCatalogue />
                                : moduleId === 'cards-loans' ? <CardsAndLoansPanel />
                                    : moduleId === 'pricing' ? <PricingPanel />
                                        : moduleId === 'team' ? <LeaderboardPanel />
                                            : moduleId === 'activity' ? <ActivityLogPanel />
                                                : null
    return <Suspense fallback={<div className="grid min-h-48 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}>{content}</Suspense>
}
