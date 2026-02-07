import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    User,
    LogOut,
    Play,
    StopCircle,
    Globe,
    Check,
    BedDouble,
    Sparkles
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

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
import { MessageCircle, ShieldAlert, CalendarDays, Map, CreditCard } from 'lucide-react'
import { ComplianceAlert } from '@/components/compliance/ComplianceAlert'

export function DashboardPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, initialize: initAuth, signOut } = useAuthStore()
    const { hotel, subscribeToHotel } = useHotelStore()
    const { currentShift, subscribeToCurrentShift, endShift, updateCompliance } = useShiftStore()
    const { subscribeToNotes } = useNotesStore()
    const subscribeToRoster = useRosterStore((state) => state.subscribeToRoster)
    const subscribeToTodayMenu = useStaffMealStore((state) => state.subscribeToTodayMenu)
    const { t, language, setLanguage } = useLanguageStore()


    const [isHandoverOpen, setIsHandoverOpen] = useState(false)
    const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false)
    const [showTour, setShowTour] = useState(false)
    const [activeTab, setActiveTab] = useState(location.pathname === '/operations' ? 'operations' : 'overview')

    // Update activeTab when location changes (e.g. via navigate('/operations'))
    useEffect(() => {
        if (location.pathname === '/operations') {
            setActiveTab('operations')
        } else if (location.pathname === '/') {
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
    useEffect(() => {
        const setupHotel = async () => {
            if (!user) return

            const hotelId = user.hotel_id

            if (!hotelId) {
                navigate('/setup-hotel')
                return
            }

            const unsubHotel = subscribeToHotel(hotelId)
            const unsubShift = subscribeToCurrentShift(hotelId)
            const unsubNotes = subscribeToNotes(hotelId)
            const unsubRoster = subscribeToRoster(hotelId)
            const unsubMenu = subscribeToTodayMenu(hotelId)

            return () => {
                unsubHotel()
                unsubShift()
                unsubNotes()
                unsubRoster()
                unsubMenu()
            }
        }

        setupHotel()
    }, [user, navigate, subscribeToHotel, subscribeToCurrentShift, subscribeToNotes])

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
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-indigo-500/30">
            <OnboardingWizard forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <TourOverlay isOpen={showTour} onClose={() => setShowTour(false)} />
            <AIAssistantModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                initialTask={aiInitialTask}
            />
            <ComplianceAlert />
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="font-bold text-white">R</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg tracking-tight">Relay</h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{hotel?.info.name}</p>
                        </div>
                    </div>

                    {/* Dashboard Tabs List */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                        <TabsList className="bg-zinc-900/50 border border-zinc-800 h-9">
                            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                {t('module.overview') || 'Genel Bakış'}
                            </TabsTrigger>
                            <TabsTrigger value="operations" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                {t('module.operations') || 'Operasyon Merkezi'}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-3">
                    {/* Compliance Pulse (Mini) */}
                    {currentShift && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse",
                                compliancePercentage === 100 ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <span className="text-xs text-zinc-400 font-medium">{compliancePercentage}% {t('module.compliance')}</span>
                        </div>
                    )}

                    <div id="tour-notifications">
                        <NotificationDropdown />
                    </div>

                    {/* Language Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white">
                                <Globe className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="text-xs">
                                🇺🇸 English {language === 'en' && <Check className="ml-auto w-3 h-3" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="text-xs">
                                🇹🇷 Türkçe {language === 'tr' && <Check className="ml-auto w-3 h-3" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Profile - Consolidated Actions */}
                    <div id="tour-profile">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-500/50 shadow-lg shadow-indigo-500/20 ml-2 hover:bg-indigo-500 transition-colors overflow-hidden">
                                    <span className="text-xs font-bold text-white">
                                        {user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4 text-white" />}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 p-2">
                                <DropdownMenuLabel className="px-2 py-1.5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white">{user?.name || t('common.unknown')}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase">{user?.role}</span>
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator className="bg-zinc-800 my-2" />

                                <DropdownMenuItem onClick={() => setShowTour(true)} className="gap-2 cursor-pointer">
                                    <Map className="w-4 h-4 text-amber-400" />
                                    <span className="text-zinc-300">Guided Tour</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowTutorial(true)} className="gap-2 cursor-pointer">
                                    <Play className="w-4 h-4 text-indigo-400" />
                                    <span className="text-zinc-300">Replay Intro</span>
                                </DropdownMenuItem>

                                <div className="space-y-1">
                                    <DropdownMenuLabel className="text-[10px] text-zinc-500 font-normal uppercase px-2">{t('dashboard.actions')}</DropdownMenuLabel>

                                    <DropdownMenuItem onClick={() => openAI('general')} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer px-3 py-2 rounded-lg focus:bg-indigo-500/10 transition-colors">
                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-medium">Assistant AI</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => setIsRoomManagerOpen(true)} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer px-3 py-2 rounded-lg focus:bg-amber-500/10 transition-colors">
                                        <BedDouble className="w-4 h-4 text-amber-400" />
                                        <span className="text-xs font-medium">{t('dashboard.rooms')}</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-zinc-800" />

                                    {!currentShift ? (
                                        <DropdownMenuItem onClick={() => navigate('/shift-start')} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 cursor-pointer px-3 py-2 rounded-lg focus:bg-emerald-500/10 transition-colors">
                                            <Play className="w-4 h-4" />
                                            <span className="text-xs font-medium">{t('dashboard.startShift')}</span>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={() => setIsHandoverOpen(true)} className="flex items-center gap-2 text-rose-400 hover:text-rose-300 cursor-pointer px-3 py-2 rounded-lg focus:bg-rose-500/10 transition-colors">
                                            <StopCircle className="w-4 h-4" />
                                            <span className="text-xs font-medium">{t('dashboard.endShift')}</span>
                                        </DropdownMenuItem>
                                    )}
                                </div>

                                <DropdownMenuSeparator className="bg-zinc-800 my-2" />

                                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer px-3 py-2 rounded-lg focus:bg-zinc-800 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-xs font-medium">{t('auth.logout')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Mobile Tabs (Visible only on small screens) */}
            <div className="md:hidden border-b border-zinc-800 bg-black/50 backdrop-blur-xl px-4 py-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-zinc-900/50 border border-zinc-800 h-10 w-full">
                        <TabsTrigger value="overview" className="flex-1 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                            {t('module.overview') || 'Genel Bakış'}
                        </TabsTrigger>
                        <TabsTrigger value="operations" className="flex-1 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                            {t('module.operations') || 'Operasyon'}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden p-4 lg:p-6">
                <AnnouncementBanner />
                <Tabs value={activeTab} className="h-full border-none p-0 bg-transparent shadow-none">
                    <TabsContent value="overview" className="h-full m-0 border-none p-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                            {/* -- LEFT COLUMN: Shift Notes (Full Height) -- */}
                            <div className="lg:col-span-1 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
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
                            <div className="lg:col-span-1 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
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
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    >
                                        <RosterMatrix hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                    </motion.div>
                                )}
                            </div>

                            {/* -- RIGHT COLUMN: Admin & Management (Scrollable) -- */}
                            <div className="lg:col-span-1 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                                {/* 3. Hotel Info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                </motion.div>

                                {/* 3. Daily Menu */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <StaffMealCard hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                </motion.div>

                                {/* 1. Calendar Widget */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <CalendarWidget hotelId={hotel?.id || ''} />
                                </motion.div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="operations" className="h-full m-0 border-none p-0 outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                        <div className="space-y-8 pb-12">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.operationsHub')}</h2>
                                <p className="text-zinc-500 text-lg font-sans">{t('dashboard.operationsDesc')}</p>
                            </div>

                            <Tabs defaultValue="messaging" className="space-y-8">
                                <TabsList className="bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 h-12 w-full justify-start overflow-x-auto whitespace-nowrap no-scrollbar">
                                    <TabsTrigger value="messaging" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 shrink-0">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t('module.messaging')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="feedback" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 shrink-0">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t('module.complaints')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="off-days" id="tour-offdays" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 shrink-0">
                                        <CalendarDays className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t('module.offDays')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="tours" id="tour-tours" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 shrink-0">
                                        <Map className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t('module.tours')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="sales" id="tour-sales" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 shrink-0">
                                        <CreditCard className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t('module.sales')}</span>
                                    </TabsTrigger>
                                </TabsList>

                                <div className="mt-8">
                                    <TabsContent value="messaging" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                                        <MessagingPanel />
                                    </TabsContent>
                                    <TabsContent value="feedback" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                                        <FeedbackSection />
                                    </TabsContent>
                                    <TabsContent value="off-days" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                                        <OffDayScheduler />
                                    </TabsContent>
                                    <TabsContent value="tours" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                                        <TourCatalogue />
                                    </TabsContent>
                                    <TabsContent value="sales" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                                        <SalesPanel />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Modals */}
            <RoomManagementModal
                isOpen={isRoomManagerOpen}
                onClose={() => setIsRoomManagerOpen(false)}
            />

            <HandoverWizard
                isOpen={isHandoverOpen}
                onClose={() => setIsHandoverOpen(false)}
                hotelId={hotel?.id || ''}
                onComplete={handleHandoverComplete}
            />
            <AnnouncementModal />
        </div>
    )
}
