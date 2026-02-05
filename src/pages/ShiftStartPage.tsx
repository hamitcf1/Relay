import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Loader2, Play, Wallet, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

export default function ShiftStartPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()

    const [cashStart, setCashStart] = useState<string>('0')
    const [shiftType, setShiftType] = useState<'A' | 'B' | 'C'>('A')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleStartShift = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !hotel?.id) return

        setLoading(true)
        setError(null)

        try {
            const shiftId = `shift-${Date.now()}`
            const hotelId = hotel.id

            // Create active shift document
            await setDoc(doc(db, 'hotels', hotelId, 'shifts', shiftId), {
                userId: user.uid, // Keep for backward compatibility or simple queries if needed
                userName: user.name,
                startTime: serverTimestamp(),
                endTime: null,
                date: new Date().toISOString().split('T')[0],
                status: 'active',
                type: shiftType,
                staff_ids: [user.uid],
                cash_start: parseFloat(cashStart) || 0,
                cash_end: 0,
                compliance: {
                    kbs_checked: false,
                    agency_msg_checked_count: 0
                },
                handover_note: ''
            })

            // Update user state (redundant but helpful for some local queries)
            await updateDoc(doc(db, 'users', user.uid), {
                current_shift_type: shiftType
            })

            navigate('/')
        } catch (err) {
            console.error('Error starting shift:', err)
            setError(err instanceof Error ? err.message : 'Failed to start shift')
        } finally {
            setLoading(false)
        }
    }

    const shiftTypes = [
        { id: 'A', label: 'Shift A', time: '08:00 - 16:00', icon: Clock },
        { id: 'B', label: 'Shift B', time: '16:00 - 00:00', icon: Clock },
        { id: 'C', label: 'Shift C', time: '00:00 - 08:00', icon: Clock },
    ] as const

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden p-4 font-sans">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"
                    animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ top: '20%', left: '10%' }}
                />
                <motion.div
                    className="absolute w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"
                    animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ bottom: '20%', right: '10%' }}
                />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="glass rounded-3xl p-8 shadow-2xl space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                            <Play className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{t('dashboard.startShift')}</h1>
                        <p className="text-zinc-500 text-sm">Welcome! Please initialize your shift data.</p>
                    </div>

                    <form onSubmit={handleStartShift} className="space-y-6">
                        {/* Shift Type Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Select Shift Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {shiftTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setShiftType(type.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                            shiftType === type.id
                                                ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5"
                                                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-xl border transition-colors",
                                                shiftType === type.id ? "bg-indigo-500 border-indigo-400" : "bg-zinc-800 border-zinc-700"
                                            )}>
                                                <type.icon className={cn("w-4 h-4", shiftType === type.id ? "text-white" : "text-zinc-500")} />
                                            </div>
                                            <div className="text-left">
                                                <div className={cn("text-sm font-semibold", shiftType === type.id ? "text-white" : "text-zinc-300")}>
                                                    {type.label}
                                                </div>
                                                <div className="text-[10px] text-zinc-500">{type.time}</div>
                                            </div>
                                        </div>
                                        {shiftType === type.id && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Starting Cash */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Starting Cash</label>
                            <div className="relative group">
                                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={cashStart}
                                    onChange={(e) => setCashStart(e.target.value)}
                                    className="h-14 pl-12 bg-zinc-900/50 border-zinc-800 text-lg font-medium tracking-tight rounded-2xl focus:border-indigo-500/50 transition-all"
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-medium tracking-tight">TRY</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-900/20 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <LogIn className="w-5 h-5" />
                                    <span>Proceed to Dashboard</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-zinc-600 text-xs">Logged in as <span className="text-zinc-400 font-medium">{user?.name}</span></p>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors underline underline-offset-4"
                    >
                        Switch Account
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
