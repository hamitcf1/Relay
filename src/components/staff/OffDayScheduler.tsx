import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Check, X, Clock, Loader2, Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOffDayStore } from '@/stores/offDayStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function OffDayScheduler() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { requests, subscribeToRequests, submitRequest, updateRequest, updateRequestStatus, loading } = useOffDayStore()
    const { addEvent } = useCalendarStore()

    const [date, setDate] = useState('')
    const [reason, setReason] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
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
            if (editingId) {
                await updateRequest(hotel.id, editingId, {
                    date,
                    reason: reason.trim()
                })
                setEditingId(null)
            } else {
                await submitRequest(hotel.id, {
                    staff_id: user.uid,
                    staff_name: user.name,
                    date,
                    reason: reason.trim()
                })
            }
            setDate('')
            setReason('')
        } catch (error) {
            console.error("Submission error:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (request: any) => {
        setEditingId(request.id)
        setDate(request.date)
        setReason(request.reason)
    }

    const handleAction = async (request: any, status: 'approved' | 'rejected') => {
        if (!hotel?.id || !user) return
        await updateRequestStatus(hotel.id, request.id, status, user.uid)

        if (status === 'approved') {
            await addEvent(hotel.id, {
                type: 'off_day',
                title: `İSİNLİ: ${request.staff_name}`,
                description: request.reason,
                date: parseISO(request.date),
                time: null,
                room_number: null,
                total_price: null,
                collected_amount: null,
                created_by: user.uid,
                created_by_name: user.name
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">İzin Yönetimi</h2>
                    <p className="text-zinc-500 text-sm">Personel izin programlarını talep edin ve yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request Form (Staff only) */}
                {!isGM && (
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-zinc-200 flex items-center gap-2 text-base">
                                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                                {editingId ? 'Talebi Düzenle' : 'Yeni Talep'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {editingId ? 'Mevcut izin talebinizi güncelleyin.' : 'İzin almak istediğiniz tarihi gönderin.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Seçilen Tarih</label>
                                    <Input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-zinc-950 border-zinc-800 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Sebep / Not</label>
                                    <textarea
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Talep için kısa açıklama..."
                                        className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingId(null)
                                                setDate('')
                                                setReason('')
                                            }}
                                            className="flex-1 text-zinc-400 hover:text-white"
                                        >
                                            İptal
                                        </Button>
                                    )}
                                    <Button
                                        disabled={submitting || !date || !reason.trim()}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {editingId ? 'Güncelle' : 'Talebi Gönder'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Request List */}
                <Card className={cn("bg-zinc-900/50 border-zinc-800 flex flex-col min-h-[500px]", !isGM ? "lg:col-span-2" : "lg:col-span-3")}>
                    <CardHeader className="border-b border-zinc-800">
                        <CardTitle className="text-zinc-200 flex items-center gap-2 text-base">
                            <Clock className="w-5 h-5 text-amber-400" />
                            {isGM ? "Bekleyen Talepler" : "Talep Geçmişim"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-800" /></div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20">
                                <CalendarIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-20" />
                                <p className="text-zinc-600">Talep bulunamadı.</p>
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
                                                    <p className="text-sm font-bold text-white">{isGM ? r.staff_name : "İzin Talebi"}</p>
                                                    <Badge className={cn(
                                                        "text-[10px] uppercase px-1.5 h-4",
                                                        r.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                        r.status === 'approved' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                        r.status === 'rejected' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    )}>
                                                        {r.status === 'pending' ? 'bekliyor' : r.status === 'approved' ? 'onaylandı' : 'reddedildi'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-zinc-500 line-clamp-1">{r.reason}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isGM && r.status === 'pending' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleEdit(r)}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-8 text-xs"
                                                >
                                                    Düzenle
                                                </Button>
                                            )}

                                            {isGM && r.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-3"
                                                        onClick={() => handleAction(r, 'approved')}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="bg-rose-600 hover:bg-rose-500 text-white h-9 px-3"
                                                        onClick={() => handleAction(r, 'rejected')}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-zinc-600 italic">
                                                    ID: {r.id.slice(0, 8)}
                                                </p>
                                            )}
                                        </div>
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
