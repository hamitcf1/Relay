import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Play, StopCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { LogFeed } from '@/components/logs/LogFeed'
import { StickyBoard } from '@/components/logs/StickyBoard'
import { NewLogModal } from '@/components/logs/NewLogModal'
import { CurrentShiftDisplay } from '@/components/shift/CurrentShiftDisplay'
import { CompliancePulse } from '@/components/compliance/CompliancePulse'
import { ComplianceChecklist } from '@/components/compliance/ComplianceChecklist'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { HandoverWizard } from '@/components/handover/HandoverWizard'
import { useAuthStore } from '@/stores/authStore'
import { useLogsStore } from '@/stores/logsStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useShiftStore } from '@/stores/shiftStore'

export function DashboardPage() {
    const navigate = useNavigate()
    const { user, signOut, initialize: initAuth } = useAuthStore()
    const { logs, pinnedLogs, loading: logsLoading, setHotelId, subscribeToLogs, updateLogStatus, togglePin } = useLogsStore()
    const { hotel, subscribeToHotel } = useHotelStore()
    const { currentShift, subscribeToCurrentShift, endShift } = useShiftStore()

    const [isNewLogOpen, setIsNewLogOpen] = useState(false)
    const [isHandoverOpen, setIsHandoverOpen] = useState(false)

    // Initialize auth listener
    useEffect(() => {
        const unsubscribe = initAuth()
        return () => unsubscribe()
    }, [initAuth])

    // Get user's hotel and set up subscription
    useEffect(() => {
        const setupHotel = async () => {
            if (!user) return

            // Check localStorage first
            let hotelId = localStorage.getItem('relay_hotel_id')

            // If not in localStorage, check user's Firestore doc
            if (!hotelId) {
                const userDoc = await getDoc(doc(db, 'users', user.uid))
                if (userDoc.exists()) {
                    hotelId = userDoc.data().hotel_id || null
                    if (hotelId) {
                        localStorage.setItem('relay_hotel_id', hotelId)
                    }
                }
            }

            // If still no hotel, redirect to setup
            if (!hotelId) {
                navigate('/setup-hotel')
                return
            }

            // Set up subscriptions
            setHotelId(hotelId)
            const unsubHotel = subscribeToHotel(hotelId)
            const unsubLogs = subscribeToLogs()
            const unsubShift = subscribeToCurrentShift(hotelId)

            return () => {
                unsubHotel()
                unsubLogs()
                unsubShift()
            }
        }

        setupHotel()
    }, [user, navigate, setHotelId, subscribeToHotel, subscribeToLogs, subscribeToCurrentShift])

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
        // TODO: Open room history modal
        console.log('Room clicked:', roomNumber)
    }

    const handleShiftAction = () => {
        if (currentShift) {
            // End shift -> Open Handover Wizard
            setIsHandoverOpen(true)
        } else {
            // Start shift -> In a real app this would likely be a modal too
            // For now we'll just show the button, logic would go here
            console.log('Start shift clicked')
        }
    }

    const onHandoverComplete = async (cashEnd: number, notes: string) => {
        if (!hotel?.id || !currentShift) return
        await endShift(hotel.id, currentShift.shift_id, cashEnd, notes)
    }

    const isGM = user?.role === 'gm'

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl opacity-50" />
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header & Status Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Welcome & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                            <div>
                                <h1 className="text-2xl font-bold mb-1">
                                    Welcome back, <span className="text-gradient-primary">{user?.name}</span>
                                </h1>
                                <p className="text-zinc-400">
                                    {hotel?.info.name || 'Loading...'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button onClick={() => setIsNewLogOpen(true)} className="shadow-lg shadow-indigo-500/20">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Entry
                                </Button>
                                <Button
                                    variant={currentShift ? "destructive" : "outline"}
                                    onClick={handleShiftAction}
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
                        </motion.div>

                        {/* Current Shift Status */}
                        <CurrentShiftDisplay hotelId={hotel?.id || ''} />
                    </div>

                    {/* Right: Compliance Pulse */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center"
                    >
                        <CompliancePulse />
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Operations (Logs & Sticky Board) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Sticky Board */}
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-zinc-300 px-1">📌 Pinned Items</h2>
                            <StickyBoard
                                pinnedLogs={pinnedLogs}
                                onTogglePin={handleTogglePin}
                                onRoomClick={handleRoomClick}
                            />
                        </div>

                        {/* Log Feed */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-zinc-300 px-1">Activity Feed</h2>
                            <LogFeed
                                logs={logs}
                                loading={logsLoading}
                                onTogglePin={handleTogglePin}
                                onResolve={handleResolve}
                                onRoomClick={handleRoomClick}
                            />
                        </div>
                    </div>

                    {/* Right Column: Management (Compliance, Notes, Info, Roster) */}
                    <div className="space-y-6">
                        {/* Compliance Checklist */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <ComplianceChecklist hotelId={hotel?.id || ''} />
                        </motion.div>

                        {/* Shift Notes */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ShiftNotes hotelId={hotel?.id || ''} />
                        </motion.div>

                        {/* Hotel Info (Collapsible?) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <HotelInfoPanel hotelId={hotel?.id || ''} canEdit={isGM} />
                        </motion.div>

                        {/* Roster (GM Only) */}
                        {isGM && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <RosterMatrix hotelId={hotel?.id || ''} canEdit={true} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

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
