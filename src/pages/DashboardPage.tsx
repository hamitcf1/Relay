import { lazy, Suspense, useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

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
import { Clock as ClockIcon, EyeOff } from 'lucide-react'
import { DateTimeWidget } from '@/components/layout/DateTimeWidget'
import { MobileNav } from '@/components/layout/MobileNav'
import { OperationsGrid } from '@/components/dashboard/OperationsGrid'
import { OverviewGrid } from '@/components/dashboard/OverviewGrid'
import { ChevronLeft } from 'lucide-react'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { ShiftTimer } from '@/components/layout/ShiftTimer'
import { SecurityTimer } from '@/components/layout/SecurityTimer'
import { SecurityModal } from '@/components/layout/SecurityModal'
import { CompliancePanel } from '@/components/dashboard/CompliancePanel'
import { CompliancePulse } from '@/components/dashboard/CompliancePulse'
import { KpiBadges } from '@/components/dashboard/KpiBadges'
import { useSecurityStore } from '@/stores/securityStore'

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
const RoomManagementPanel = lazy(() => import('@/components/rooms/RoomManagementPanel').then(m => ({ default: m.RoomManagementPanel })))
const CardsAndLoansPanel = lazy(() => import('@/components/loans/CardsAndLoansPanel').then(m => ({ default: m.CardsAndLoansPanel })))

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
                setOverviewTab('grid')
            }
        }
    }, [location.pathname, location.search])

    // Automate shifts
    useShiftAutomator(hotel?.id || null)

    // Due payment notifications
    useDuePaymentNotifier()

    // 23:00 Security Check Trigger
    const { startCountdown } = useSecurityStore()
    useEffect(() => {
        const checkSecurityTime = () => {
            const now = new Date()
            const hours = now.getHours()
            const minutes = now.getMinutes()
            
            // Trigger at 23:00 (11 PM)
            if (hours === 23 && minutes === 0) {
                const alreadyTriggered = localStorage.getItem('relay_security_triggered_today')
                const today = now.toISOString().split('T')[0]
                
                if (alreadyTriggered !== today) {
                    startCountdown(300, 'idle') // 5 min countdown for night check
                    localStorage.setItem('relay_security_triggered_today', today)
                }
            }
        }

        const interval = setInterval(checkSecurityTime, 60000) // Check every minute
        return () => clearInterval(interval)
    }, [startCountdown])

    // Auto-logout when countdown hits 0
    const { countdown, stopCountdown } = useSecurityStore()
    const signOut = useAuthStore(state => state.signOut)

    useEffect(() => {
        if (countdown === 0) {
            const performLogout = async () => {
                stopCountdown()
                await signOut()
                window.location.href = '/login'
            }
            performLogout()
        }
    }, [countdown, signOut, stopCountdown])

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
                <header className="safe-header border-b border-border/40 bg-background flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 relative h-16">
                    <div className="flex items-center md:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                                <span className="font-bold text-primary-foreground text-sm">R</span>
                            </div>
                            <div>
                                <h1 className="font-semibold text-base tracking-tight leading-none text-foreground">Relay</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-[150px] truncate mt-0.5">{hotel?.info.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center pl-2">
                        <KpiBadges onNavigate={(tab, subTab) => {
                            setActiveTab(tab)
                            if (tab === 'operations' && subTab) setOperationTab(subTab)
                        }} />
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-1 sm:mr-2 scale-90 sm:scale-100 origin-right">
                            {(currentShift || user?.role === 'gm' || (user && schedule[user.uid]?.[format(new Date(), 'yyyy-MM-dd')] && schedule[user.uid]?.[format(new Date(), 'yyyy-MM-dd')] !== 'OFF')) && (
                                <CompliancePulse 
                                    agencyChecked={currentShift?.compliance.agency_msg_checked_count ? currentShift.compliance.agency_msg_checked_count > 0 : false}
                                    kbsChecked={currentShift?.compliance.kbs_checked || false}
                                    className="mr-2"
                                />
                            )}
                            <ShiftTimer />
                            <SecurityTimer />
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
                        <div id="tour-notifications" className="mr-2">
                            <NotificationDropdown />
                        </div>
                    </div>
                </header>

            <main className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col relative min-h-0">
                <AnnouncementBanner />
                
                <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0 border-none p-0 bg-transparent shadow-none">
                    
                    {/* OVERVIEW VIEW */}
                    <TabsContent value="overview" className="flex-1 min-h-0 m-0 border-none p-0 outline-none data-[state=active]:flex flex-col overflow-y-auto lg:overflow-hidden">
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
                            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0 h-auto md:h-full max-w-[1600px] mx-auto w-full", isMobile ? "p-0 pb-32" : "")}>
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
                        <TabsContent value="operations" className="h-full m-0 border-none p-0 outline-none data-[state=active]:flex flex-col overflow-hidden">
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
                                        <Suspense fallback={<TabFallback />}>
                                            <TabsContent value="messaging" className="h-full m-0 p-0 outline-none pb-24 lg:pb-0">
                                                <MessagingPanel />
                                            </TabsContent>
                                            <TabsContent value="compliance" className="h-full m-0 p-6 outline-none pb-24 lg:pb-0 overflow-y-auto">
                                                <div className="max-w-2xl mx-auto space-y-6">
                                                    <div className="space-y-1">
                                                        <h2 className="text-2xl font-bold tracking-tight">{t('module.compliance') || 'Compliance'}</h2>
                                                        <p className="text-sm text-muted-foreground">{t('operations.compliance.desc') || 'Maintain operational standards for the current shift.'}</p>
                                                    </div>
                                                    <CompliancePanel hotelId={hotel?.id || ''} className="p-2" />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="settings" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <HotelSettings />
                                            </TabsContent>
                                            <TabsContent value="sales" className="h-full m-0 p-0 outline-none pb-24 lg:pb-0">
                                                <SalesPanel />
                                            </TabsContent>
                                            <TabsContent value="feedback" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <FeedbackSection />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="off-days" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <OffDayScheduler />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="tours" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <TourCatalogue />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="rooms" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <RoomManagementPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="cards-loans" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <CardsAndLoansPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="pricing" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <PricingPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="team" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <LeaderboardPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                            <TabsContent value="activity" className="h-full m-0 p-0 outline-none overflow-y-auto relative custom-scrollbar pb-24 lg:pb-0">
                                                <ActivityLogPanel />
                                                <ScrollToTopButton />
                                            </TabsContent>
                                        </Suspense>
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
            <SecurityModal />
        </div>
    )
}
