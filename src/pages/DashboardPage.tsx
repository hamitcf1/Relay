import { lazy, Suspense, useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock as ClockIcon, ChevronLeft, EyeOff, Loader2, MoonStar, Search, SunMedium } from 'lucide-react'

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { AnnouncementModal } from '@/components/messaging/AnnouncementModal'

import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { StaffMealCard } from '@/components/hotel/StaffMealCard'
import { useShiftAutomator } from '@/hooks/useShiftAutomator'
import { useDuePaymentNotifier } from '@/hooks/useDuePaymentNotifier'
import { AnnouncementBanner } from '@/components/announcements/AnnouncementBanner'
import { TourOverlay } from '@/components/onboarding/TourOverlay'
import { CurrencyWidget } from '@/components/dashboard/CurrencyWidget'

import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useNotesStore } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useSalesStore } from '@/stores/salesStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useStaffMealStore } from '@/stores/staffMealStore'
import { useBlacklistStore } from '@/stores/blacklistStore'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { BlacklistModule } from '@/components/dashboard/BlacklistModule'
import { DateTimeWidget } from '@/components/layout/DateTimeWidget'
import { MobileNav } from '@/components/layout/MobileNav'
import { OperationsGrid } from '@/components/dashboard/OperationsGrid'
import { OperationsOverview } from '@/components/dashboard/OperationsOverview'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { ShiftTimer } from '@/components/layout/ShiftTimer'
import { AttendanceClock } from '@/components/attendance/AttendanceClock'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { CompliancePanel } from '@/components/dashboard/CompliancePanel'
import { CompliancePulse } from '@/components/dashboard/CompliancePulse'
import { RelayMark } from '@/components/brand/RelayBrand'


// Lazy-loaded operations panels — each tab becomes its own chunk
const MessagingPanel = lazy(() => import('@/components/messaging/MessagingPanel').then(m => ({ default: m.MessagingPanel })))
const FeedbackSection = lazy(() => import('@/components/feedback/FeedbackSection').then(m => ({ default: m.FeedbackSection })))
const OffDayScheduler = lazy(() => import('@/components/staff/OffDayScheduler').then(m => ({ default: m.OffDayScheduler })))
const TourCatalogue = lazy(() => import('@/components/tours/TourCatalogue').then(m => ({ default: m.TourCatalogue })))
const SalesPanel = lazy(() => import('@/components/sales/SalesPanel').then(m => ({ default: m.SalesPanel })))
const PricingPanel = lazy(() => import('@/components/pricing/PricingPanel').then(m => ({ default: m.PricingPanel })))
const LeaderboardPanel = lazy(() => import('@/components/team/LeaderboardPanel').then(m => ({ default: m.LeaderboardPanel })))
const ActivityLogPanel = lazy(() => import('@/components/activity/ActivityLogPanel').then(m => ({ default: m.ActivityLogPanel })))
const HotelSettings = lazy(() => import('@/components/settings/HotelSettings').then(m => ({ default: m.HotelSettings })))
const CardsAndLoansPanel = lazy(() => import('@/components/loans/CardsAndLoansPanel').then(m => ({ default: m.CardsAndLoansPanel })))
const AttendanceReportPanel = lazy(() => import('@/components/attendance/AttendanceReportPanel').then(m => ({ default: m.AttendanceReportPanel })))

function TabFallback() {
    return (
        <div className="flex items-center justify-center h-full p-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
    )
}

export function DashboardPage() {
    const location = useLocation()
    const user = useAuthStore((state) => state.user)
    const initAuth = useAuthStore((state) => state.initialize)
    const hotel = useHotelStore((state) => state.hotel)
    const subscribeToHotel = useHotelStore((state) => state.subscribeToHotel)
    const currentShift = useShiftStore((state) => state.currentShift)
    const subscribeToCurrentShift = useShiftStore((state) => state.subscribeToCurrentShift)
    const schedule = useRosterStore((state) => state.schedule)
    const subscribeToRoster = useRosterStore((state) => state.subscribeToRoster)
    const subscribeToNotes = useNotesStore((state) => state.subscribeToNotes)
    const subscribeToTodayMenu = useStaffMealStore((state) => state.subscribeToTodayMenu)
    const subscribeToAttendance = useAttendanceStore((state) => state.subscribeToAttendance)
    const { t, language } = useLanguageStore()

    const [showTour, setShowTour] = useState(false)
    const [activeTab, setActiveTab] = useState(location.pathname === '/operations' ? 'operations' : 'overview')
    const [operationTab, setOperationTab] = useState('messaging')
    const [overviewTab, setOverviewTab] = useState('grid')
    const [openNewNote, setOpenNewNote] = useState(false)

    // Mobile Detection
    const isMobile = useIsMobile()

    const [showDateTime, setShowDateTime] = useState(() => {
        const saved = localStorage.getItem('relay_show_datetime')
        return saved !== 'false' // default: true
    })

    // Persist showDateTime changes to localStorage
    useEffect(() => {
        localStorage.setItem('relay_show_datetime', String(showDateTime))
    }, [showDateTime])

    // Update activeTab when location changes (e.g. via navigate('/operations'))
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const tabParam = searchParams.get('tab')
        const chatParam = searchParams.get('chat')

        if (location.pathname === '/operations') {
            setActiveTab('operations')
            if (tabParam) {
                setOperationTab(tabParam)
            } else if (chatParam) {
                setOperationTab('messaging')
            }
        } else if (location.pathname === '/dashboard' || location.pathname === '/') {
            setActiveTab('overview')
            if (tabParam) {
                setOverviewTab(tabParam)
            } else {
                setOverviewTab(window.matchMedia('(max-width: 767px)').matches ? 'notes' : 'grid')
            }
        }
    }, [location.pathname, location.search])

    // Automate shifts
    useShiftAutomator(hotel?.id || null)

    // Due payment notifications
    useDuePaymentNotifier()



    // Subscribe to sales for dashboard visibility
    const { subscribeToSales } = useSalesStore()

    useEffect(() => {
        if (!hotel?.id) return
        const unsubSales = subscribeToSales(hotel.id)
        return () => {
            unsubSales()
        }
    }, [hotel?.id, subscribeToSales])



    // Initialize auth listener
    useEffect(() => {
        const unsubscribe = initAuth()
        return () => unsubscribe()
    }, [initAuth])

    // Get user's hotel and set up subscription
    const userHotelId = user?.hotel_id

    useEffect(() => {
        if (!userHotelId) {
            // Only redirect if explicitly not loading and no hotelId (handled in auth guard usually)
            return
        }

        const unsubHotel = subscribeToHotel(userHotelId)
        const unsubShift = subscribeToCurrentShift(userHotelId)
        const unsubNotes = subscribeToNotes(userHotelId)
        const unsubRoster = subscribeToRoster(userHotelId)
        const unsubMenu = subscribeToTodayMenu(userHotelId)
        const unsubAttendance = (user?.role === 'gm' || user?.role === 'receptionist')
            ? subscribeToAttendance(userHotelId, user.role === 'gm' ? undefined : user.uid)
            : () => undefined
        const subscribeToBlacklist = useBlacklistStore.getState().subscribeToBlacklist
        const unsubBlacklist = subscribeToBlacklist(userHotelId)

        return () => {
            unsubHotel()
            unsubShift()
            unsubNotes()
            unsubRoster()
            unsubMenu()
            unsubAttendance()
            unsubBlacklist()
        }
    }, [userHotelId, user?.role, user?.uid, subscribeToHotel, subscribeToCurrentShift, subscribeToNotes, subscribeToRoster, subscribeToTodayMenu, subscribeToAttendance])








    const [showTutorial, setShowTutorial] = useState(false)

    const rosterShift = user ? schedule[user.uid]?.[format(new Date(), 'yyyy-MM-dd')] : undefined
    const inferredShift = new Date().getHours() >= 16 ? 'B' : new Date().getHours() < 8 ? 'C' : 'A'
    const activeShiftCode = currentShift?.type || (rosterShift && rosterShift !== 'OFF' ? rosterShift : inferredShift)
    const configuredShift = hotel?.settings?.shifts?.find((shift) => shift.code === activeShiftCode)
    const fallbackShiftTimes: Record<string, [string, string]> = { A: ['08:00', '16:00'], B: ['16:00', '00:00'], C: ['00:00', '08:00'], E: ['10:00', '18:00'] }
    const shiftTimes = fallbackShiftTimes[activeShiftCode] || fallbackShiftTimes.A
    const shiftName = configuredShift?.name || (language === 'tr'
        ? ({ A: 'Gündüz', B: 'Akşam', C: 'Gece', E: 'Ara vardiya' }[activeShiftCode] || 'Vardiya')
        : language === 'ru'
            ? ({ A: 'День', B: 'Вечер', C: 'Ночь', E: 'Средняя смена' }[activeShiftCode] || 'Смена')
            : ({ A: 'Day shift', B: 'Evening', C: 'Night', E: 'Mid shift' }[activeShiftCode] || 'Shift'))
    const shiftStart = configuredShift?.startTime || shiftTimes[0]
    const shiftEnd = configuredShift?.endTime || shiftTimes[1]

    return (
        <div className="relay-app h-[100dvh] overflow-hidden bg-background text-foreground flex font-sans selection:bg-primary/30 relative">

            <OnboardingWizard forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <TourOverlay isOpen={showTour} onClose={() => setShowTour(false)} />

            {/* Application Sidebar (Desktop only) */}
            <AppSidebar
                activeTab={activeTab}
                operationTab={operationTab}
                overviewTab={overviewTab}
                userRole={user?.role}
                onNavigate={(tab, subTab) => {
                    setActiveTab(tab)
                    if (tab === 'operations' && subTab) {
                        setOperationTab(subTab)
                    } else if (tab === 'overview') {
                        if (subTab === 'notes') setOpenNewNote(false)
                        setOverviewTab(subTab || 'grid')
                    }
                }}
            />

            {/* Main Content Pane */}
            <div className="flex flex-col flex-1 relative min-w-0 overflow-hidden">
                <header className="relay-commandbar safe-header relative z-40 flex h-[84px] shrink-0 items-center justify-between border-b border-border/70 bg-[#080b0e]/95 px-5 backdrop-blur-xl md:px-7">
                    <div className="flex items-center md:hidden">
                        <RelayMark className="h-10 w-10 text-primary" />
                    </div>

                    <div className="relay-mobile-shift md:hidden">
                        {activeShiftCode === 'C' || activeShiftCode === 'B' ? <MoonStar /> : <SunMedium />}
                        <span><strong>{shiftName}</strong><small>{shiftStart}–{shiftEnd}</small></span>
                    </div>

                    <label className="relay-command-search hidden h-11 w-full max-w-[470px] items-center gap-3 rounded-lg border border-border bg-white/[0.025] px-4 text-muted-foreground md:flex">
                        <Search className="h-4 w-4" />
                        <input aria-label={t('common.search') as string} placeholder={t('common.search') as string} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                        <kbd className="rounded border border-border/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
                    </label>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-1 sm:mr-2 scale-90 sm:scale-100 origin-right">
                            {(currentShift || user?.role === 'gm' || (user && schedule[user.uid]?.[format(new Date(), 'yyyy-MM-dd')] && schedule[user.uid]?.[format(new Date(), 'yyyy-MM-dd')] !== 'OFF')) && (
                                <CompliancePulse 
                                    agencyChecked={currentShift?.compliance.agency_msg_checked_count ? currentShift.compliance.agency_msg_checked_count > 0 : false}
                                    kbsChecked={currentShift?.compliance.kbs_checked || false}
                                    className="hidden md:flex md:mr-2"
                                />
                            )}
                            <div className="hidden md:block"><ShiftTimer /></div>
                            <AttendanceClock />
                        </div>
                        <AnimatePresence>
                            {showDateTime && (
                                <div className="hidden lg:block">
                                    <DateTimeWidget />
                                </div>
                            )}
                        </AnimatePresence>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex"
                            onClick={() => setShowDateTime(!showDateTime)}
                            title={showDateTime ? "Hide Time" : "Show Time"}
                        >
                            {showDateTime ? <EyeOff className="w-3.5 h-3.5" /> : <ClockIcon className="w-3.5 h-3.5" />}
                        </Button>
                        <div id="tour-notifications">
                            <NotificationDropdown />
                        </div>
                    </div>
                </header>

            <main className="relay-scroll-root relative min-h-0 flex-1 overflow-y-auto pb-28 md:pb-8">
                <div className="relay-page">
                <AnnouncementBanner />
                
                <Tabs value={activeTab} className="border-none p-0 bg-transparent shadow-none">
                    
                    {/* OVERVIEW VIEW */}
                    <TabsContent value="overview" className="m-0 border-none p-0 outline-none">
                        {overviewTab !== 'grid' && !isMobile && (
                            <div className="sticky top-0 z-30 mb-5 flex items-center gap-2 rounded-[1.1rem] border border-border/50 bg-background/[0.82] px-3 py-2 backdrop-blur-xl">
                                <Button variant="ghost" size="icon" onClick={() => setOverviewTab('grid')} className="-ml-2">
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {language === 'tr' ? 'Operasyon özetine dön' : language === 'ru' ? 'Вернуться к операциям' : 'Back to operations'}
                                </span>
                            </div>
                        )}

                        {overviewTab === 'grid' ? (
                            <OperationsOverview
                                onOpenNotes={() => {
                                    setOpenNewNote(false)
                                    setOverviewTab('notes')
                                }}
                                onNewRecord={() => {
                                    setOpenNewNote(true)
                                    setOverviewTab('notes')
                                }}
                                onOpenAttendance={() => {
                                    setActiveTab('operations')
                                    setOperationTab('attendance')
                                }}
                                onOpenRoster={() => {
                                    setOpenNewNote(false)
                                    setOverviewTab('roster')
                                }}
                                onOpenSales={() => {
                                    setActiveTab('operations')
                                    setOperationTab('sales')
                                }}
                            />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                                className="mx-auto w-full max-w-6xl px-3 py-5 lg:px-6"
                            >
                                {overviewTab === 'notes' && <ShiftNotes hotelId={hotel?.id || ''} initialAddOpen={openNewNote} />}
                                {overviewTab === 'roster' && (user?.role === 'gm' || user?.role === 'receptionist') && <RosterMatrix hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />}
                                {overviewTab === 'hotel-info' && <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />}
                                {overviewTab === 'currency' && <CurrencyWidget />}
                                {overviewTab === 'menu' && <StaffMealCard hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />}
                                {overviewTab === 'calendar' && <CalendarWidget hotelId={hotel?.id || ''} />}
                                {overviewTab === 'blacklist' && <BlacklistModule hotelId={hotel?.id || ''} />}
                            </motion.div>
                        )}
                        <ScrollToTopButton />
                        </TabsContent>

                        {/* OPERATIONS VIEW */}
                        <TabsContent value="operations" className="m-0 border-none p-0 outline-none">
                            <Tabs value={operationTab} onValueChange={setOperationTab}>
                                {/* Mobile Header for Sub-pages */}
                                {isMobile && operationTab !== 'grid' && operationTab !== 'messaging' && (
                                    <div className="sticky top-0 z-30 mb-4 flex items-center gap-2 rounded-[1.1rem] border border-border/50 bg-background/[0.82] px-3 py-2 backdrop-blur-xl">
                                        <Button variant="ghost" size="icon" onClick={() => setOperationTab('grid')} className="-ml-2">
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <span className="font-semibold text-lg capitalize">
                                            {operationTab === 'attendance'
                                                ? t('module.attendance')
                                                : ((t(`module.${operationTab}` as any) as string) || operationTab)}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    {isMobile && operationTab === 'grid' && (
                                        <OperationsGrid
                                            onSelect={(id) => {
                                                if (id === 'overview') {
                                                    setActiveTab('overview')
                                                    setOverviewTab('grid')
                                                    return
                                                }
                                                setOperationTab(id)
                                            }}
                                            userRole={user?.role}
                                        />
                                    )}

                                    <div className={cn(isMobile && operationTab === 'grid' ? "hidden" : "block")}>
                                        <Suspense fallback={<TabFallback />}>
                                            <TabsContent value="messaging" className="m-0 h-[calc(100dvh-7rem)] min-h-[36rem] p-3 outline-none md:p-5">
                                                <MessagingPanel />
                                            </TabsContent>
                                            <TabsContent value="compliance" className="m-0 p-4 outline-none lg:p-6">
                                                <div className="max-w-2xl mx-auto space-y-6">
                                                    <div className="space-y-1">
                                                        <h2 className="text-2xl font-bold tracking-tight">{t('module.compliance') || 'Compliance'}</h2>
                                                        <p className="text-sm text-muted-foreground">{t('operations.compliance.desc') || 'Maintain operational standards for the current shift.'}</p>
                                                    </div>
                                                    <CompliancePanel hotelId={hotel?.id || ''} className="p-2" />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="settings" className="m-0 p-0 outline-none">
                                                <HotelSettings />
                                            </TabsContent>
                                            <TabsContent value="sales" className="m-0 p-0 outline-none">
                                                <SalesPanel />
                                            </TabsContent>
                                            <TabsContent value="feedback" className="m-0 p-4 outline-none md:p-6">
                                                <FeedbackSection />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="off-days" className="m-0 p-4 outline-none md:p-6">
                                                <OffDayScheduler />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="tours" className="m-0 p-4 outline-none md:p-6">
                                                <TourCatalogue />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="cards-loans" className="m-0 p-0 outline-none">
                                                <CardsAndLoansPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="pricing" className="m-0 p-0 outline-none">
                                                <PricingPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="team" className="m-0 p-0 outline-none">
                                                <LeaderboardPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="activity" className="m-0 p-0 outline-none">
                                                <ActivityLogPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="attendance" className="m-0 p-0 outline-none">
                                                <AttendanceReportPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                        </Suspense>
                                    </div>
                                </div>
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation Layout stays consistent */}
            <MobileNav
                activeTab={activeTab}
                overviewTab={overviewTab}
                operationTab={operationTab}
                onOpenNotes={() => {
                    setActiveTab('overview')
                    setOpenNewNote(false)
                    setOverviewTab('notes')
                }}
                onOpenRoster={() => {
                    setActiveTab('overview')
                    setOpenNewNote(false)
                    setOverviewTab('roster')
                }}
                onNewRecord={() => {
                    setActiveTab('overview')
                    setOpenNewNote(true)
                    setOverviewTab('notes')
                }}
                onOpenMessages={() => {
                    setActiveTab('operations')
                    setOperationTab('messaging')
                }}
                onOpenMenu={() => {
                    setActiveTab('operations')
                    setOperationTab('grid')
                }}
            />
            <AnnouncementModal />

        </div>
    )
}
