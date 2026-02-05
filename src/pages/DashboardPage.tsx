import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Hotel,
    Bell,
    User,
    LogOut,
    Plus,
    Play,
    StopCircle,
    Menu,
    X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogFeed } from '@/components/logs/LogFeed'
import { StickyBoard } from '@/components/logs/StickyBoard'
import { NewLogModal } from '@/components/logs/NewLogModal'
import { CurrentShiftDisplay } from '@/components/shift/CurrentShiftDisplay'
import { CompliancePulse } from '@/components/compliance/CompliancePulse'
import { ComplianceChecklist } from '@/components/compliance/ComplianceChecklist'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { HandoverWizard } from '@/components/handover/HandoverWizard'
import { useAuthStore } from '@/stores/authStore'
import { useLogsStore } from '@/stores/logsStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useNotesStore } from '@/stores/notesStore'

export function DashboardPage() {
    const navigate = useNavigate()
    const { user, signOut, initialize: initAuth } = useAuthStore()
    const { logs, pinnedLogs, loading: logsLoading, setHotelId, subscribeToLogs, updateLogStatus, togglePin } = useLogsStore()
    const { hotel, subscribeToHotel } = useHotelStore()
    const { currentShift, subscribeToCurrentShift, endShift, updateCompliance } = useShiftStore()
    const { subscribeToNotes } = useNotesStore()

    const [isNewLogOpen, setIsNewLogOpen] = useState(false)
    const [isHandoverOpen, setIsHandoverOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    const criticalTickets = logs.filter(l => l.urgency === 'critical' && l.status === 'open').length

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

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const handleResolve = async (logId: string) => {
        await updateLogStatus(logId, 'resolved')
    }

    const handleTogglePin = async (logId: string, isPinned: boolean) => {
        await togglePin(logId, isPinned)
    }

    const handleRoomClick = (roomNumber: string) => {
        console.log('Room clicked:', roomNumber)
    }

    const handleShiftAction = () => {
        if (currentShift) {
            setIsHandoverOpen(true)
        } else {
            console.log('Start shift clicked')
        }
    }

    const handleKBSCheck = async () => {
        if (!hotel?.id || !currentShift) return
        await updateCompliance(hotel.id, 'kbs_checked', true)
    }

    const handleAgencyCheck = async () => {
        if (!hotel?.id || !currentShift) return
        await updateCompliance(hotel.id, 'agency_msg_checked_count', currentShift.compliance.agency_msg_checked_count + 1)
    }

    const onHandoverComplete = async (cashEnd: number, notes: string) => {
        if (!hotel?.id || !currentShift) return
        await endShift(hotel.id, cashEnd, notes)
    }

    const isGM = user?.role === 'gm'

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                HEADER - Premium Glass Navigation
               ═══════════════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 glass border-b border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 glow-primary">
                                <Hotel className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient-primary">
                                Relay
                            </span>
                        </motion.div>

                        {/* Center: Compliance Pulse */}
                        <motion.div
                            className="hidden md:flex items-center gap-4"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <CompliancePulse percentage={compliancePercentage} size="sm" />
                        </motion.div>

                        {/* Right: User Menu */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {/* Notification Bell */}
                            <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors relative">
                                <Bell className="w-5 h-5 text-zinc-400" />
                                {criticalTickets > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs flex items-center justify-center font-bold animate-pulse">
                                        {criticalTickets}
                                    </span>
                                )}
                            </button>

                            {/* User Profile */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                <User className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-300">{user?.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                    {user?.role?.toUpperCase()}
                                </Badge>
                            </div>

                            {/* Sign Out */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSignOut}
                                title="Sign Out"
                                className="hover:bg-rose-500/10 hover:text-rose-400"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors md:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-5 h-5 text-zinc-400" />
                                ) : (
                                    <Menu className="w-5 h-5 text-zinc-400" />
                                )}
                            </button>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════════
                MAIN CONTENT
               ═══════════════════════════════════════════════════════════════════ */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* Welcome Banner */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="glass rounded-2xl p-6 border border-zinc-800/50">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    Welcome back, <span className="text-gradient-primary">{user?.name}</span>
                                </h1>
                                <p className="text-zinc-400">
                                    {hotel?.info.name || 'Loading...'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => setIsNewLogOpen(true)}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Entry
                                </Button>
                                <Button
                                    variant={currentShift ? "destructive" : "outline"}
                                    onClick={handleShiftAction}
                                    className={currentShift ? "shadow-lg shadow-rose-500/25" : ""}
                                >
                                    {currentShift ? (
                                        <>
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            End Shift
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Shift
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {[
                        { label: 'Active Shift', value: currentShift?.type || '—', color: 'indigo' },
                        { label: 'Open Tickets', value: openTickets.toString(), color: 'amber' },
                        { label: 'Critical', value: criticalTickets.toString(), color: criticalTickets > 0 ? 'rose' : 'zinc' },
                        { label: 'Pinned', value: pinnedLogs.length.toString(), color: 'purple' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            className="glass rounded-xl p-4 glass-hover"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                        >
                            <div className="text-zinc-400 text-xs mb-1">{stat.label}</div>
                            <div className={`text-2xl font-bold text-${stat.color}-400`}>
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Current Shift Display */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <CurrentShiftDisplay
                        hotelId={hotel?.id || ''}
                        userId={user?.uid || ''}
                    />
                </motion.div>

                {/* Main Grid: Operations + Management */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Left Column: Operations (2/3 width) */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Sticky Board */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <StickyBoard
                                pinnedLogs={pinnedLogs}
                                onTogglePin={handleTogglePin}
                                onRoomClick={handleRoomClick}
                            />
                        </motion.div>

                        {/* Activity Feed */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="space-y-4"
                        >
                            <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Live Activity Feed
                            </h2>
                            <LogFeed
                                logs={logs}
                                loading={logsLoading}
                                onTogglePin={handleTogglePin}
                                onResolve={handleResolve}
                                onRoomClick={handleRoomClick}
                            />
                        </motion.div>
                    </div>

                    {/* Right Column: Management (1/3 width) */}
                    <div className="space-y-6">
                        {/* Compliance Checklist */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <ComplianceChecklist
                                compliance={currentShift?.compliance || { kbs_checked: false, agency_msg_checked_count: 0 }}
                                onKBSCheck={handleKBSCheck}
                                onAgencyCheck={handleAgencyCheck}
                                disabled={!currentShift}
                            />
                        </motion.div>

                        {/* Shift Notes */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                        >
                            <ShiftNotes hotelId={hotel?.id || ''} />
                        </motion.div>

                        {/* Hotel Info Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={isGM} />
                        </motion.div>

                        {/* Calendar Widget */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.42 }}
                        >
                            <CalendarWidget hotelId={hotel?.id || ''} />
                        </motion.div>

                        {/* Roster (GM Only) */}
                        <AnimatePresence>
                            {isGM && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, delay: 0.45 }}
                                >
                                    <RosterMatrix hotelId={hotel?.id || ''} canEdit={true} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-zinc-600 text-sm border-t border-zinc-800/50">
                Relay Hotel Operations System • {new Date().getFullYear()}
            </footer>

            {/* Modals */}
            <NewLogModal
                isOpen={isNewLogOpen}
                onClose={() => setIsNewLogOpen(false)}
            />

            <HandoverWizard
                isOpen={isHandoverOpen}
                onClose={() => setIsHandoverOpen(false)}
                hotelId={hotel?.id || ''}
                onComplete={onHandoverComplete}
            />
        </div>
    )
}
