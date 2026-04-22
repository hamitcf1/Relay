import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { AnnouncementModal } from '@/components/messaging/AnnouncementModal'

import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { RoomManagementPanel } from '@/components/rooms/RoomManagementPanel'
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
import { MessagingPanel } from '@/components/messaging/MessagingPanel'
import { FeedbackSection } from '@/components/feedback/FeedbackSection'
import { OffDayScheduler } from '@/components/staff/OffDayScheduler'
import { TourCatalogue } from '@/components/tours/TourCatalogue'
import { SalesPanel } from '@/components/sales/SalesPanel'
import { PricingPanel } from '@/components/pricing/PricingPanel'
import { LeaderboardPanel } from '@/components/team/LeaderboardPanel'
import { ActivityLogPanel } from '@/components/activity/ActivityLogPanel'
import { BlacklistModule } from '@/components/dashboard/BlacklistModule'
import { Clock as ClockIcon, EyeOff } from 'lucide-react'
import { DateTimeWidget } from '@/components/layout/DateTimeWidget'
import { MobileNav } from '@/components/layout/MobileNav'
import { OperationsGrid } from '@/components/dashboard/OperationsGrid'
import { OverviewGrid } from '@/components/dashboard/OverviewGrid'
import { ChevronLeft } from 'lucide-react'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { AppSidebar } from '@/components/layout/AppSidebar'

export function DashboardPage() {
    const location = useLocation()
    const user = useAuthStore((state) => state.user)
    const initAuth = useAuthStore((state) => state.initialize)
    const hotel = useHotelStore((state) => state.hotel)
    const subscribeToHotel = useHotelStore((state) => state.subscribeToHotel)
    const subscribeToCurrentShift = useShiftStore((state) => state.subscribeToCurrentShift)
    const subscribeToNotes = useNotesStore((state) => state.subscribeToNotes)
    const subscribeToRoster = useRosterStore((state) => state.subscribeToRoster)
    const subscribeToTodayMenu = useStaffMealStore((state) => state.subscribeToTodayMenu)
    const { t } = useLanguageStore()

    const [showTour, setShowTour] = useState(false)
    const [activeTab, setActiveTab] = useState(location.pathname === '/operations' ? 'operations' : 'overview')
    const [operationTab, setOperationTab] = useState('messaging')
    const [overviewTab, setOverviewTab] = useState('grid')

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
        if (location.pathname === '/operations') {
            setActiveTab('operations')
        } else if (location.pathname === '/dashboard' || location.pathname === '/') {
            setActiveTab('overview')
            setOverviewTab('grid') // Reset to grid when navigating back to root
        }
    }, [location.pathname])

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
        const subscribeToBlacklist = useBlacklistStore.getState().subscribeToBlacklist
        const unsubBlacklist = subscribeToBlacklist(userHotelId)

        return () => {
            unsubHotel()
            unsubShift()
            unsubNotes()
            unsubRoster()
            unsubMenu()
            unsubBlacklist()
        }
    }, [userHotelId, subscribeToHotel, subscribeToCurrentShift, subscribeToNotes, subscribeToRoster, subscribeToTodayMenu])








    const [showTutorial, setShowTutorial] = useState(false)

    return (
        <div className="h-[100dvh] overflow-hidden bg-background text-foreground flex font-sans selection:bg-primary/30 relative">
            {/* Background Gradients (Cyber Theme) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            <OnboardingWizard forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <TourOverlay isOpen={showTour} onClose={() => setShowTour(false)} />

            {/* Application Sidebar (Desktop only) */}
            <AppSidebar
                activeTab={activeTab}
                operationTab={operationTab}
                userRole={user?.role}
                onNavigate={(tab, subTab) => {
                    setActiveTab(tab)
                    if (tab === 'operations' && subTab) {
                        setOperationTab(subTab)
                    } else if (tab === 'overview') {
                        setOverviewTab('grid')
                    }
                }}
            />

            {/* Main Content Pane */}
            <div className="flex flex-col flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-0 relative min-w-0 overflow-hidden">
                {/* Header Navbar (Visible mostly for Mobile layout and utility items) */}
                <header className="safe-header border-b border-border/40 bg-background/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 transition-all duration-300 relative h-16">
                    <div className="flex items-center gap-8 md:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                <span className="font-bold text-primary-foreground">R</span>
                            </div>
                            <div>
                                <h1 className="font-semibold text-lg tracking-tight leading-none text-foreground">Relay</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-[150px] truncate">{hotel?.info.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center gap-2 mr-2">
                            <AnimatePresence>
                                {showDateTime && (
                                    <DateTimeWidget />
                                )}
                            </AnimatePresence>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowDateTime(!showDateTime)}
                                title={showDateTime ? "Hide Time" : "Show Time"}
                            >
                                {showDateTime ? <EyeOff className="w-3.5 h-3.5" /> : <ClockIcon className="w-3.5 h-3.5" />}
                            </Button>
                        </div>
                        <div id="tour-notifications" className="mr-2">
                            <NotificationDropdown />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col transition-all duration-300 relative min-h-0 bg-background/30">
                    <AnnouncementBanner />
                    
                    <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0 border-none p-0 bg-transparent shadow-none">
                        
                        {/* OVERVIEW VIEW */}
                        <TabsContent value="overview" className="flex-1 min-h-0 m-0 border-none p-0 outline-none data-[state=active]:flex flex-col overflow-y-auto lg:overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                            {isMobile && overviewTab !== 'grid' && (
                                <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20 mb-4 rounded-xl">
                                    <Button variant="ghost" size="icon" onClick={() => setOverviewTab('grid')} className="-ml-2">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <span className="font-semibold text-lg capitalize">
                                        {overviewTab === 'notes' ? t('module.shiftNotes') :
                                            overviewTab === 'hotel-info' ? t('module.hotelInfo') :
                                                overviewTab === 'calendar' ? t('module.calendar') :
                                                    overviewTab === 'menu' ? 'Daily Menu' :
                                                        overviewTab === 'currency' ? t('currency.title') :
                                                            overviewTab === 'roster' ? t('module.roster') : 'Overview'}
                                    </span>
                                </div>
                            )}

                            {isMobile && overviewTab === 'grid' ? (
                                <OverviewGrid onSelect={(id) => setOverviewTab(id)} userRole={user?.role} />
                            ) : (
                                <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 h-auto lg:h-full", isMobile ? "p-0 pb-32" : "")}>
                                    {/* Left Column */}
                                    <div className={cn("lg:col-span-1 h-auto lg:h-full flex flex-col min-h-0 gap-6 lg:overflow-y-auto relative lg:pr-2 custom-scrollbar",
                                        isMobile && overviewTab !== 'notes' && overviewTab !== 'roster' && "hidden"
                                    )}>
                                        <div id="tour-logs" className={cn(isMobile && overviewTab !== 'notes' && "hidden")}>
                                            <ShiftNotes hotelId={hotel?.id || ''} />
                                        </div>
                                        {(user?.role === 'gm' || user?.role === 'receptionist') && (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className={cn(isMobile && overviewTab !== 'roster' && "hidden")}>
                                                <RosterMatrix hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                            </motion.div>
                                        )}
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className={cn(isMobile && overviewTab !== 'roster' && "hidden")}>
                                            <BlacklistModule hotelId={hotel?.id || ''} />
                                        </motion.div>
                                        <ScrollToTopButton />
                                    </div>

                                    {/* Right Column */}
                                    <div className={cn("lg:col-span-1 h-auto lg:h-full flex flex-col min-h-0 gap-6 lg:overflow-y-auto relative lg:pr-2 custom-scrollbar pb-20 lg:pb-0",
                                        isMobile && !['hotel-info', 'menu', 'currency', 'calendar'].includes(overviewTab) && "hidden lg:flex"
                                    )}>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn(isMobile && overviewTab !== 'hotel-info' && "hidden")}>
                                            <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn(isMobile && overviewTab !== 'currency' && "hidden")}>
                                            <CurrencyWidget />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cn(isMobile && overviewTab !== 'menu' && "hidden")}>
                                            <StaffMealCard hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={cn(isMobile && overviewTab !== 'calendar' && "hidden")}>
                                            <CalendarWidget hotelId={hotel?.id || ''} />
                                        </motion.div>
                                        <ScrollToTopButton />
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* OPERATIONS VIEW */}
                        <TabsContent value="operations" className="h-full m-0 border-none p-0 outline-none data-[state=active]:flex flex-col overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                            <Tabs value={operationTab} onValueChange={setOperationTab} className="flex-1 flex flex-col min-h-0">
                                {/* Mobile Header for Sub-pages */}
                                {isMobile && operationTab !== 'grid' && (
                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20 mb-4 rounded-xl">
                                        <Button variant="ghost" size="icon" onClick={() => setOperationTab('grid')} className="-ml-2">
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <span className="font-semibold text-lg capitalize">{(t(`module.${operationTab}` as any) as string) || operationTab}</span>
                                    </div>
                                )}

                                <div className="flex-1 min-h-0">
                                    {isMobile && operationTab === 'grid' && (
                                        <OperationsGrid onSelect={(id) => setOperationTab(id)} userRole={user?.role} />
                                    )}

                                    <div className={cn("h-full", isMobile && operationTab === 'grid' ? "hidden" : "block")}>
                                        <TabsContent value="messaging" className="h-full m-0 p-0 outline-none pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <MessagingPanel />
                                        </TabsContent>
                                        <TabsContent value="sales" className="h-full m-0 p-0 outline-none pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <SalesPanel />
                                        </TabsContent>
                                        
                                        <TabsContent value="feedback" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <FeedbackSection />
                                            <ScrollToTopButton />
                                        </TabsContent>
                                        <TabsContent value="off-days" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <OffDayScheduler />
                                            <ScrollToTopButton />
                                        </TabsContent>
                                        <TabsContent value="tours" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <TourCatalogue />
                                            <ScrollToTopButton />
                                        </TabsContent>
                                        <TabsContent value="rooms" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <RoomManagementPanel />
                                            <ScrollToTopButton />
                                        </TabsContent>
                                        <TabsContent value="pricing" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <PricingPanel />
                                            <ScrollToTopButton />
                                        </TabsContent>
                                        <TabsContent value="team" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                            <LeaderboardPanel />
                                            <ScrollToTopButton />
                                        </TabsContent>
                                        {user?.role === 'gm' && (
                                            <TabsContent value="activity" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500">
                                                <ActivityLogPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                        )}
                                    </div>
                                </div>
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Mobile Bottom Navigation Layout stays consistent */}
            <MobileNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenProfile={() => {
                    const trigger = document.querySelector('[data-radix-collection-item]') as HTMLElement;
                    if (trigger) trigger.click();
                }}
            />
            <AnnouncementModal />
        </div>
    )
}
