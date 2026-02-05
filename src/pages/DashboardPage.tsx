import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    User,
    LogOut,
    Plus,
    Play,
    StopCircle,
    Globe,
    ChevronDown,
    Check,
    BedDouble,
    Sparkles,
    LayoutGrid
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

import { LogFeed } from '@/components/logs/LogFeed'
import { StickyBoard } from '@/components/logs/StickyBoard'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'
import { NewLogModal } from '@/components/logs/NewLogModal'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { RoomManagementModal } from '@/components/rooms/RoomManagementModal'
import { CurrentShiftDisplay } from '@/components/shift/CurrentShiftDisplay'
import { HandoverWizard } from '@/components/handover/HandoverWizard'
import { ComplianceChecklist } from '@/components/compliance/ComplianceChecklist'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { useShiftAutomator } from '@/hooks/useShiftAutomator'

import { useAuthStore } from '@/stores/authStore'
import { useLogsStore } from '@/stores/logsStore'
import type { Log } from '@/types'
import { useHotelStore } from '@/stores/hotelStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useNotesStore } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'

export function DashboardPage() {
    const navigate = useNavigate()
    const { user, initialize: initAuth, signOut } = useAuthStore()
    const { logs, pinnedLogs, loading: logsLoading, setHotelId, subscribeToLogs, updateLogStatus, togglePin, archiveLog } = useLogsStore()
    const { hotel, subscribeToHotel } = useHotelStore()
    const { currentShift, subscribeToCurrentShift, endShift, updateCompliance } = useShiftStore()
    const { subscribeToNotes } = useNotesStore()
    const { t, language, setLanguage } = useLanguageStore()

    const [isNewLogOpen, setIsNewLogOpen] = useState(false)
    const [editingLog, setEditingLog] = useState<Log | null>(null)
    const [isHandoverOpen, setIsHandoverOpen] = useState(false)
    const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false)

    // Automate shifts
    useShiftAutomator(hotel?.id || null)

    // Calculate compliance percentage
    const compliancePercentage = useMemo(() => {
        if (!currentShift) return 0
        let score = 0
        if (currentShift.compliance.kbs_checked) score += 50
        if (currentShift.compliance.agency_msg_checked_count > 0) score += 50
        return score
    }, [currentShift])

    // Calculate stats
    const openTickets = logs.filter(l => l.status === 'open').length

    // Initialize auth listener
    useEffect(() => {
        const unsubscribe = initAuth()
        return () => unsubscribe()
    }, [initAuth])

    // Get user's hotel and set up subscription
    useEffect(() => {
        const setupHotel = async () => {
            if (!user) return

            let hotelId = localStorage.getItem('relay_hotel_id')

            if (!hotelId) {
                const userDoc = await getDoc(doc(db, 'users', user.uid))
                if (userDoc.exists()) {
                    hotelId = userDoc.data().hotel_id || null
                    if (hotelId) localStorage.setItem('relay_hotel_id', hotelId)
                }
            }

            if (!hotelId) {
                navigate('/setup-hotel')
                return
            }

            setHotelId(hotelId)
            const unsubHotel = subscribeToHotel(hotelId)
            const unsubLogs = subscribeToLogs()
            const unsubShift = subscribeToCurrentShift(hotelId)
            const unsubNotes = subscribeToNotes(hotelId)

            return () => {
                unsubHotel()
                unsubLogs()
                unsubShift()
                unsubNotes()
            }
        }

        setupHotel()
    }, [user, navigate, setHotelId, subscribeToHotel, subscribeToLogs, subscribeToCurrentShift, subscribeToNotes])

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

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-indigo-500/30">
            <OnboardingWizard />
            <AIAssistantModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                initialTask={aiInitialTask}
            />
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="font-bold text-white">R</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg tracking-tight">Relay</h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{hotel?.info.name}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Compliance Pulse (Mini) */}
                    {currentShift && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse",
                                compliancePercentage === 100 ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <span className="text-xs text-zinc-400 font-medium">{compliancePercentage}% {t('module.compliance')}</span>
                        </div>
                    )}

                    <Link to="/operations" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                        <LayoutGrid className="w-5 h-5" />
                    </Link>

                    <NotificationDropdown />

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

                    {/* Rooms Manager Button */}
                    <Button
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9 hidden sm:flex"
                        onClick={() => setIsRoomManagerOpen(true)}
                    >
                        <BedDouble className="w-4 h-4 mr-2" />
                        {t('dashboard.rooms')}
                    </Button>

                    {/* Actions Menu (Merged) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 h-9">
                                <Plus className="w-4 h-4 mr-2" />
                                {t('dashboard.actions')}
                                <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
                            <DropdownMenuLabel className="text-xs text-zinc-500 font-normal uppercase">{t('dashboard.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openAI('general')} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer px-3 py-2.5 rounded-lg focus:bg-indigo-500/10">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-xs font-semibold">AI Assistant</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsNewLogOpen(true)} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer px-3 py-2.5 rounded-lg focus:bg-emerald-500/10">
                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs font-semibold">{t('dashboard.newLog')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsHandoverOpen(true)} className="text-xs cursor-pointer">
                                <LogOut className="w-3.5 h-3.5 mr-2" /> {t('category.handover')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            {!currentShift ? (
                                <DropdownMenuItem onClick={() => navigate('/shift-start')} className="text-xs cursor-pointer text-emerald-400">
                                    <Play className="w-3.5 h-3.5 mr-2" /> {t('dashboard.startShift')}
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => setIsHandoverOpen(true)} className="text-xs cursor-pointer text-rose-400">
                                    <StopCircle className="w-3.5 h-3.5 mr-2" /> {t('dashboard.endShift')}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 ml-2 hover:bg-zinc-700 transition-colors">
                                <User className="w-4 h-4 text-zinc-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
                            <DropdownMenuLabel className="text-xs text-zinc-500 font-normal uppercase">{user?.name || 'User'}</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem onClick={() => signOut()} className="text-xs cursor-pointer text-rose-400">
                                <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Layout - 3 Columns */}
            <main className="flex-1 overflow-hidden p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* -- LEFT COLUMN: Activity Feed (Full Height) -- */}
                    <div className="lg:col-span-3 h-full flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t('module.activityFeed')}
                            </h2>
                            <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 text-zinc-400">
                                {openTickets} {t('status.active')}
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700">
                            <LogFeed
                                logs={logs}
                                loading={logsLoading}
                                onTogglePin={togglePin}
                                onResolve={(id: string, currentStatus: string) => updateLogStatus(id, currentStatus === 'resolved' ? 'open' : 'resolved')} // Support toggle/reopen
                                onArchive={archiveLog}
                                onEdit={(log) => {
                                    setEditingLog(log)
                                    setIsNewLogOpen(true)
                                }}
                                onRoomClick={(room) => console.log('Room clicked:', room)}
                            />
                        </div>
                    </div>

                    {/* -- CENTER COLUMN: Operations (Scrollable) -- */}
                    <div className="lg:col-span-5 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        {/* 1. Current Shift & Pulse */}
                        <div className="space-y-4">
                            <CurrentShiftDisplay hotelId={hotel?.id || ''} userId={user?.uid || ''} />
                        </div>

                        {/* 2. Shift Notes (Moved from right column) */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <ShiftNotes hotelId={hotel?.id || ''} />
                        </motion.div>

                        {/* 2. Sticky Board (Priority) */}
                        <StickyBoard
                            pinnedLogs={pinnedLogs}
                            onTogglePin={togglePin}
                            onResolve={(id) => updateLogStatus(id, 'resolved')}
                        />

                        {/* 3. Compliance Checklist */}
                        {currentShift && (
                            <ComplianceChecklist
                                compliance={currentShift.compliance}
                                onKBSCheck={handleKBSCheck}
                                onAgencyCheck={handleAgencyCheck}
                                disabled={false}
                            />
                        )}
                    </div>

                    {/* -- RIGHT COLUMN: Admin & Management (Scrollable) -- */}
                    <div className="lg:col-span-4 h-full flex flex-col min-h-0 gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        {/* 1. Calendar Widget */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <CalendarWidget hotelId={hotel?.id || ''} />
                        </motion.div>



                        {/* 3. Hotel Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                        </motion.div>

                        {/* 4. Roster (Only for GM) */}
                        {(user?.role === 'gm' || user?.role === 'receptionist') && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <RosterMatrix hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <RoomManagementModal
                isOpen={isRoomManagerOpen}
                onClose={() => setIsRoomManagerOpen(false)
                }
            />

            <NewLogModal
                isOpen={isNewLogOpen}
                onClose={() => {
                    setIsNewLogOpen(false)
                    setEditingLog(null)
                }}
                initialLog={editingLog || undefined}
            />

            <HandoverWizard
                isOpen={isHandoverOpen}
                onClose={() => setIsHandoverOpen(false)}
                hotelId={hotel?.id || ''}
                onComplete={handleHandoverComplete}
            />
        </div>
    )
}
