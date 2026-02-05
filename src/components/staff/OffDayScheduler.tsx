import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Check, X, Clock, Loader2, Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOffDayStore } from '@/stores/offDayStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function OffDayScheduler() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { requests, subscribeToRequests, submitRequest, updateRequestStatus, loading } = useOffDayStore()

    const [date, setDate] = useState('')
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const isGM = user?.role === 'gm'

    useEffect(() => {
        if (hotel?.id) {
            const unsub = subscribeToRequests(hotel.id, isGM ? undefined : user?.uid)
            return () => unsub()
        }
    }, [hotel?.id, user?.uid, isGM, subscribeToRequests])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date || !reason.trim() || !hotel?.id || !user) return

        setSubmitting(true)
        try {
            await submitRequest(hotel.id, {
                staff_id: user.uid,
                staff_name: user.name,
                date,
                reason: reason.trim()
            })
            setDate('')
            setReason('')
        } catch (error) {
            console.error("Submission error:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        if (!hotel?.id || !user) return
        await updateRequestStatus(hotel.id, requestId, status, user.uid)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Off-Day Management</h2>
                    <p className="text-zinc-500 text-sm">Request and manage staff leave schedules.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request Form (Staff only) */}
                {!isGM && (
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-zinc-200 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                                New Request
                            </CardTitle>
                            <CardDescription>Submit your preferred date for leave.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Selected Date</label>
                                    <Input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-zinc-950 border-zinc-800 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Reason / Note</label>
                                    <textarea
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Brief explanation for the request..."
                                        className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                                <Button
                                    disabled={submitting || !date || !reason.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Submit Request
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Request List */}
                <Card className={cn("bg-zinc-900/50 border-zinc-800 flex flex-col min-h-[500px]", !isGM ? "lg:col-span-2" : "lg:col-span-3")}>
                    <CardHeader className="border-b border-zinc-800">
                        <CardTitle className="text-zinc-200 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400" />
                            {isGM ? "Pending Requests" : "My Requests History"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-800" /></div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20">
                                <CalendarIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-20" />
                                <p className="text-zinc-600">No requests found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {requests.map((r) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 flex items-center justify-between group hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex flex-col items-center justify-center border border-zinc-700/50">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">{format(parseISO(r.date), 'MMM')}</span>
                                                <span className="text-lg font-bold text-white leading-none">{format(parseISO(r.date), 'dd')}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-white">{isGM ? r.staff_name : "Leave Request"}</p>
                                                    <Badge className={cn(
                                                        "text-[10px] uppercase px-1.5 h-4",
                                                        r.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                        r.status === 'approved' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                        r.status === 'rejected' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    )}>
                                                        {r.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-zinc-500 line-clamp-1">{r.reason}</p>
                                            </div>
                                        </div>

                                        {isGM && r.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-3"
                                                    onClick={() => handleAction(r.id, 'approved')}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="bg-rose-600 hover:bg-rose-500 text-white h-9 px-3"
                                                    onClick={() => handleAction(r.id, 'rejected')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-zinc-600 italic">
                                                ID: {r.id.slice(0, 8)}
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
