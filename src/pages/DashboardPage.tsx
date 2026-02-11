import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Activity,
    Users
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { AnnouncementModal } from '@/components/messaging/AnnouncementModal'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { RoomManagementModal } from '@/components/rooms/RoomManagementModal'
import { CurrentShiftDisplay } from '@/components/shift/CurrentShiftDisplay'
import { HandoverWizard } from '@/components/handover/HandoverWizard'
import { ComplianceChecklist } from '@/components/compliance/ComplianceChecklist'
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessagingPanel } from '@/components/messaging/MessagingPanel'
import { FeedbackSection } from '@/components/feedback/FeedbackSection'
import { OffDayScheduler } from '@/components/staff/OffDayScheduler'
import { TourCatalogue } from '@/components/tours/TourCatalogue'
import { SalesPanel } from '@/components/sales/SalesPanel'
import { PricingPanel } from '@/components/pricing/PricingPanel'
import { LeaderboardPanel } from '@/components/team/LeaderboardPanel'
import { ActivityLogPanel } from '@/components/activity/ActivityLogPanel'
import { MessageCircle, ShieldAlert, CalendarDays, Map, CreditCard, Clock as ClockIcon, EyeOff, DollarSign, ScrollText } from 'lucide-react'
import { ComplianceAlert } from '@/components/compliance/ComplianceAlert'
import { DateTimeWidget } from '@/components/layout/DateTimeWidget'
import { UserNav } from '@/components/layout/UserNav'

export function DashboardPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, initialize: initAuth } = useAuthStore()
    const { hotel, subscribeToHotel } = useHotelStore()
    const { currentShift, subscribeToCurrentShift, endShift, updateCompliance } = useShiftStore()
    const { subscribeToNotes } = useNotesStore()
    const subscribeToRoster = useRosterStore((state) => state.subscribeToRoster)
    const subscribeToTodayMenu = useStaffMealStore((state) => state.subscribeToTodayMenu)
    const { t } = useLanguageStore()


    const [isHandoverOpen, setIsHandoverOpen] = useState(false)
    const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false)
    const [showTour, setShowTour] = useState(false)
    const [activeTab, setActiveTab] = useState(location.pathname === '/operations' ? 'operations' : 'overview')
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

    // Calculate compliance percentage
    const compliancePercentage = useMemo(() => {
        if (!currentShift) return 0
        let score = 0
        if (currentShift.compliance.kbs_checked) score += 50
        if (currentShift.compliance.agency_msg_checked_count > 0) score += 50
        return score
    }, [currentShift])

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

        return () => {
            unsubHotel()
            unsubShift()
            unsubNotes()
            unsubRoster()
            unsubMenu()
        }
    }, [userHotelId, subscribeToHotel, subscribeToCurrentShift, subscribeToNotes, subscribeToRoster, subscribeToTodayMenu])


    // Handlers
    const handleKBSCheck = async () => {
        if (!hotel?.id || !currentShift) return
        await updateCompliance(hotel.id, 'kbs_checked', true)
    }

    const handleAgencyCheck = async () => {
        if (!hotel?.id || !currentShift) return
        await updateCompliance(hotel.id, 'agency_msg_checked_count', 1)
    }

    const handleHandoverComplete = async (cashEnd: number, notes: string) => {
        if (!hotel?.id) return
        await endShift(hotel.id, cashEnd, notes)
        setIsHandoverOpen(false)
        navigate('/shift-start') // Or wherever appropriate
    }

    const [isAIModalOpen, setIsAIModalOpen] = useState(false)
    const [aiInitialTask, setAiInitialTask] = useState<'general' | 'report' | 'email' | 'review'>('general')

    const openAI = (mode: typeof aiInitialTask = 'general') => {
        setAiInitialTask(mode)
        setIsAIModalOpen(true)
    }

    const [showTutorial, setShowTutorial] = useState(false)

    return (
        <div className="h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 relative">
            {/* Background Gradients (Cyber Theme) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            <OnboardingWizard forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <TourOverlay isOpen={showTour} onClose={() => setShowTour(false)} />
            <AIAssistantModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                initialTask={aiInitialTask}
            />
            <ComplianceAlert />
            {/* Header */}
            <header className="safe-header border-b border-border/40 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50 transition-all duration-300 relative">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-primary-foreground">R</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg tracking-tight">Relay</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{hotel?.info.name}</p>
                        </div>
                    </div>

                    {/* Dashboard Tabs List */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                        <TabsList className="bg-muted/50 border border-border h-9">
                            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">
                                {t('module.overview') || 'Genel Bakış'}
                            </TabsTrigger>
                            <TabsTrigger value="operations" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">
                                {t('module.operations') || 'Operasyon Merkezi'}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="hidden lg:flex items-center gap-2">
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
                </div>

                <div className="flex items-center gap-3">
                    {/* Compliance Pulse (Mini) */}
                    {currentShift && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse",
                                compliancePercentage === 100 ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <span className="text-xs text-muted-foreground font-medium">{compliancePercentage}% {t('module.compliance')}</span>
                        </div>
                    )}

                    <div id="tour-notifications">
                        <NotificationDropdown />
                    </div>

                    {/* User Profile - Consolidated Actions */}
                    <div id="tour-profile">
                        <UserNav
                            onOpenAI={openAI}
                            onOpenRoomManager={() => setIsRoomManagerOpen(true)}
                            onOpenHandover={() => setIsHandoverOpen(true)}
                        />
                    </div>
                </div>

            </header >

            {/* Mobile Bottom Navigation (Fixed) */}
            < div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe" >
                <nav className="flex items-center justify-around h-16 px-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                            activeTab === 'overview' ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <LayoutDashboard className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{t('module.overview') || 'Overview'}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('operations')}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                            activeTab === 'operations' ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Activity className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{t('module.operations') || 'Operations'}</span>
                    </button>
                </nav>
            </div >

            {/* Main Content Area */}
            < main className="flex-1 overflow-hidden p-4 lg:p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 transition-all duration-300" >
                <AnnouncementBanner />
                <Tabs value={activeTab} className="h-full border-none p-0 bg-transparent shadow-none">
                    <TabsContent value="overview" className="h-full m-0 border-none p-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                            {/* -- LEFT COLUMN: Shift Notes (Full Height) -- */}
                            <div className="lg:col-span-1 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin">
                                <div id="tour-logs">
                                    <ShiftNotes hotelId={hotel?.id || ''} />
                                </div>

                                {/* Compliance Checklist */}
                                {currentShift && (
                                    <div id="tour-shift-start">
                                        <ComplianceChecklist
                                            compliance={currentShift.compliance}
                                            onKBSCheck={handleKBSCheck}
                                            onAgencyCheck={handleAgencyCheck}
                                            disabled={false}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* -- CENTER COLUMN: Operations (Scrollable) -- */}
                            <div className="lg:col-span-1 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin">
                                {/* 1. Current Shift & Pulse */}
                                <div className="space-y-4">
                                    <CurrentShiftDisplay hotelId={hotel?.id || ''} userId={user?.uid || ''} />
                                </div>

                                {/* 2. Sticky Board & Logs (REMOVED) */}
                                {/* The user requested to remove the log system. Keeping the column structure for now or we can collapse it?
                                    Actually, if we remove this, the center column has mainly CurrentShiftDisplay.
                                    We'll keep the column but empty for now aside from ShiftDisplay.
                                */}

                                {/* 3. Roster (Weekly Program) */}
                                {(user?.role === 'gm' || user?.role === 'receptionist') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    >
                                        <RosterMatrix hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                    </motion.div>
                                )}
                            </div>

                            {/* -- RIGHT COLUMN: Admin & Management (Scrollable) -- */}
                            <div className="lg:col-span-1 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin">
                                {/* 3. Hotel Info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                </motion.div>

                                {/* 3. Daily Menu */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <StaffMealCard hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                </motion.div>

                                {/* 1. Currency Widget */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {/* Currency Widget with TCMB Rates */}
                                    <CurrencyWidget />
                                </motion.div>

                                {/* 1. Calendar Widget */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <CalendarWidget hotelId={hotel?.id || ''} />
                                </motion.div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="operations" className="h-full m-0 border-none p-0 outline-none data-[state=active]:flex flex-col overflow-hidden">
                        <div className="flex flex-col h-full">
                            <div className="flex-none px-4 pt-4 lg:px-6 lg:pt-6">
                                <div className="flex flex-col gap-2 mb-6">
                                    <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('dashboard.operationsHub')}</h2>
                                    <p className="text-muted-foreground text-lg font-sans">{t('dashboard.operationsDesc')}</p>
                                </div>
                            </div>

                            <Tabs defaultValue="messaging" className="flex-1 flex flex-col min-h-0">
                                <div className="flex-none px-4 lg:px-6 mb-4">
                                    <TabsList className="bg-muted/50 p-1 rounded-xl border border-border h-12 w-full justify-start overflow-x-auto whitespace-nowrap no-scrollbar">
                                        <TabsTrigger value="messaging" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <MessageCircle className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('module.messaging')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="feedback" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('module.complaints')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="off-days" id="tour-offdays" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <CalendarDays className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('module.offDays')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="tours" id="tour-tours" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <Map className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('module.tours')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="sales" id="tour-sales" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('module.sales')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="pricing" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="inline">{t('module.pricing_label')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="team" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 shrink-0">
                                            <Users className="w-4 h-4" />
                                            <span className="inline">{t('module.team_label')}</span>
                                        </TabsTrigger>
                                        {user?.role === 'gm' && (
                                            <TabsTrigger value="activity" className="rounded-lg gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white px-4 shrink-0">
                                                <ScrollText className="w-4 h-4" />
                                                <span className="inline">Aktivite</span>
                                            </TabsTrigger>
                                        )}

                                    </TabsList>
                                </div>

                                <div className="flex-1 min-h-0 bg-background/50 border-t border-border/50">
                                    <TabsContent value="messaging" className="h-full m-0 p-4 lg:p-6 outline-none">
                                        <MessagingPanel />
                                    </TabsContent>
                                    <TabsContent value="sales" className="h-full m-0 p-4 lg:p-6 outline-none">
                                        <SalesPanel />
                                    </TabsContent>

                                    {/* Scrollable Containers for other tabs */}
                                    <TabsContent value="feedback" className="h-full m-0 p-4 lg:p-6 outline-none overflow-y-auto custom-scrollbar pb-24">
                                        <FeedbackSection />
                                    </TabsContent>
                                    <TabsContent value="off-days" className="h-full m-0 p-4 lg:p-6 outline-none overflow-y-auto custom-scrollbar pb-24">
                                        <OffDayScheduler />
                                    </TabsContent>
                                    <TabsContent value="tours" className="h-full m-0 p-4 lg:p-6 outline-none overflow-y-auto custom-scrollbar pb-24">
                                        <TourCatalogue />
                                    </TabsContent>
                                    <TabsContent value="pricing" className="h-full m-0 p-4 lg:p-6 outline-none overflow-y-auto custom-scrollbar pb-24">
                                        <PricingPanel />
                                    </TabsContent>
                                    <TabsContent value="team" className="h-full m-0 p-4 lg:p-6 outline-none overflow-y-auto custom-scrollbar pb-24">
                                        <LeaderboardPanel />
                                    </TabsContent>
                                    {user?.role === 'gm' && (
                                        <TabsContent value="activity" className="h-full m-0 p-4 lg:p-6 outline-none overflow-y-auto custom-scrollbar pb-24">
                                            <ActivityLogPanel />
                                        </TabsContent>
                                    )}
                                </div>
                            </Tabs>
                        </div>
                    </TabsContent>
                </Tabs>
            </main >

            {/* Modals */}
            < RoomManagementModal
                isOpen={isRoomManagerOpen}
                onClose={() => setIsRoomManagerOpen(false)
                }
            />

            < HandoverWizard
                isOpen={isHandoverOpen}
                onClose={() => setIsHandoverOpen(false)}
                hotelId={hotel?.id || ''}
                onComplete={handleHandoverComplete}
            />
            <AnnouncementModal />
        </div >
    )
}
