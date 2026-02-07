import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Check, X, Clock, Loader2, Send, Plus, Trash2, RefreshCcw, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOffDayStore } from '@/stores/offDayStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseISO } from 'date-fns'
import { cn, formatDisplayDate } from '@/lib/utils'

export function OffDayScheduler() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { requests, subscribeToRequests, submitRequest, updateRequest, updateRequestStatus, deleteRequest, cancelRequest, loading } = useOffDayStore()

    const [dates, setDates] = useState<string[]>([''])
    const [reason, setReason] = useState('')
    const [requestType, setRequestType] = useState<'off_day' | 'shift'>('off_day')
    const [shiftName, setShiftName] = useState('morning')
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
        const validDates = dates.filter(d => d.trim())
        if (validDates.length === 0 || !reason.trim() || !hotel?.id || !user) return

        setSubmitting(true)
        try {
            if (editingId) {
                await updateRequest(hotel.id, editingId, {
                    date: validDates[0],
                    reason: reason.trim(),
                    type: requestType,
                    shift_name: requestType === 'shift' ? shiftName : undefined
                })
                setEditingId(null)
            } else {
                // Submit multiple requests if multiple dates
                for (const d of validDates) {
                    await submitRequest(hotel.id, {
                        staff_id: user.uid,
                        staff_name: user.name,
                        date: d,
                        reason: reason.trim(),
                        type: requestType,
                        shift_name: requestType === 'shift' ? shiftName : undefined
                    })
                }
            }
            // Reset form
            setDates([''])
            setReason('')
            setRequestType('off_day')
            setShiftName('morning')
        } catch (error) {
            console.error("Submission error:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (request: any) => {
        setEditingId(request.id)
        setDates([request.date])
        setReason(request.reason)
        setRequestType(request.type || 'off_day')
        setShiftName(request.shift_name || 'morning')
    }

    const addDateField = () => setDates([...dates, ''])
    const removeDateField = (index: number) => {
        if (dates.length > 1) {
            setDates(dates.filter((_, i) => i !== index))
        }
    }
    const updateDate = (index: number, value: string) => {
        const newDates = [...dates]
        newDates[index] = value
        setDates(newDates)
    }

    const handleAction = async (request: any, status: 'approved' | 'rejected' | 'pending') => {
        if (!hotel?.id || !user) return
        await updateRequestStatus(hotel.id, request.id, status, user.uid)
        // Note: Calendar sync removed as per user request to avoid duplicates
    }

    const handleDelete = async (requestId: string) => {
        if (!hotel?.id || !confirm('Bu talebi kalıcı olarak silmek istediğinizden emin misiniz?')) return
        await deleteRequest(hotel.id, requestId)
    }

    const handleCancel = async (requestId: string) => {
        if (!hotel?.id || !confirm('Bu talebi iptal etmek istediğinizden emin misiniz?')) return
        await cancelRequest(hotel.id, requestId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t('offday.management.title')}</h2>
                    <p className="text-zinc-500 text-sm">{t('offday.management.desc')}</p>
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
                                {editingId ? 'Mevcut talebinizi güncelleyin.' : 'İzin veya vardiya değişikliği talep edin.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Type Selection */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Talep Türü</Label>
                                    <RadioGroup
                                        value={requestType}
                                        onValueChange={(v: 'off_day' | 'shift') => setRequestType(v)}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="off_day" id="type-off" className="border-zinc-600 text-indigo-500" />
                                            <Label htmlFor="type-off" className="text-sm text-zinc-300 cursor-pointer">İzin (Off Day)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="shift" id="type-shift" className="border-zinc-600 text-indigo-500" />
                                            <Label htmlFor="type-shift" className="text-sm text-zinc-300 cursor-pointer">Vardiya İsteği</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Shift Selection (only if type is shift) */}
                                {requestType === 'shift' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-zinc-500 uppercase">İstenen Vardiya</Label>
                                        <Select value={shiftName} onValueChange={setShiftName}>
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="morning">Sabah (Morning)</SelectItem>
                                                <SelectItem value="evening">Akşam (Evening)</SelectItem>
                                                <SelectItem value="night">Gece (Night)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                                        Seçilen Tarih{dates.length > 1 ? 'ler' : ''}
                                        {!editingId && (
                                            <Button type="button" variant="ghost" size="sm" onClick={addDateField} className="h-5 px-1 text-indigo-400">
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </label>
                                    <div className="space-y-2">
                                        {dates.map((d, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input
                                                    type="date"
                                                    required
                                                    value={d}
                                                    onChange={(e) => updateDate(i, e.target.value)}
                                                    className="bg-zinc-950 border-zinc-800 focus:ring-indigo-500"
                                                />
                                                {dates.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDateField(i)} className="h-9 px-2 text-rose-500">
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
                                                setDates([''])
                                                setReason('')
                                                setRequestType('off_day')
                                            }}
                                            className="flex-1 text-zinc-400 hover:text-white"
                                        >
                                            İptal
                                        </Button>
                                    )}
                                    <Button
                                        disabled={submitting || dates.every(d => !d.trim()) || !reason.trim()}
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
                            {isGM ? t('offday.pending') : t('offday.history')}
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
                                            <div className="px-2 h-10 rounded-lg bg-zinc-800/50 flex flex-col items-center justify-center border border-zinc-700/50 min-w-[80px]">
                                                <span className="text-[10px] font-bold text-white font-mono">{formatDisplayDate(parseISO(r.date))}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-white">
                                                        {isGM ? r.staff_name :
                                                            (r.type === 'shift' ? 'Vardiya Değişikliği' : 'İzin Talebi')
                                                        }
                                                    </p>
                                                    <Badge className={cn(
                                                        "text-[10px] uppercase px-1.5 h-4",
                                                        r.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                        r.status === 'approved' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                        r.status === 'rejected' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    )}>
                                                        {r.status === 'pending' ? 'bekliyor' : r.status === 'approved' ? 'onaylandı' : 'reddedildi'}
                                                    </Badge>
                                                    {/* Request Type Badge */}
                                                    {r.type === 'shift' ? (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 flex items-center gap-1">
                                                            <Briefcase className="w-2.5 h-2.5" />
                                                            {r.shift_name?.toUpperCase()}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-zinc-700/30 text-zinc-400 border-zinc-700/50">
                                                            OFF DAY
                                                        </Badge>
                                                    )}
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

                                            {!isGM && r.status === 'pending' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleCancel(r.id)}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-rose-400 hover:text-rose-300 h-8 text-xs"
                                                >
                                                    İptal
                                                </Button>
                                            )}

                                            {!isGM && r.status === 'rejected' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleAction(r, 'pending')}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs"
                                                >
                                                    <RefreshCcw className="w-3 h-3 mr-1" />
                                                    Yeniden Talep Et
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
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-zinc-600 italic">
                                                        ID: {r.id.slice(0, 8)}
                                                    </p>
                                                    {isGM && r.status !== 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[10px] text-zinc-500 hover:text-zinc-300"
                                                                onClick={() => handleAction(r, r.status === 'approved' ? 'rejected' : 'approved')}
                                                                title={r.status === 'approved' ? 'Reddet' : 'Onayla'}
                                                            >
                                                                {r.status === 'approved' ? <X className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                                                                {r.status === 'approved' ? 'Reddet' : 'Onayla'}
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[10px] text-zinc-500 hover:text-amber-400"
                                                                onClick={() => handleAction(r, 'pending')}
                                                                title="Sıfırla (Bekliyor)"
                                                            >
                                                                <RefreshCcw className="w-3 h-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* GM Delete Button - Always visible for GM */}
                                        {isGM && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(r.id)}
                                                className="h-8 w-8 p-0 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 ml-2"
                                                title="Kalıcı Olarak Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
