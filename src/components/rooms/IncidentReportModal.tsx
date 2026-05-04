import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, X, Camera, DollarSign, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIncidentStore } from '@/stores/incidentStore'
import { useNotesStore } from '@/stores/notesStore'
import { cn } from '@/lib/utils'
import type { IncidentType, IncidentStatus } from '@/types'

interface IncidentReportModalProps {
    isOpen: boolean
    onClose: () => void
    roomNumber: string
    hotelId: string
}

export function IncidentReportModal({ isOpen, onClose, roomNumber, hotelId }: IncidentReportModalProps) {
    const { addIncident } = useIncidentStore()
    const { addNote } = useNotesStore()

    const [type, setType] = useState<IncidentType>('damage')
    const [item, setItem] = useState('')
    const [cost, setCost] = useState('')
    const [status, setStatus] = useState<IncidentStatus>('pending_payment')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const finalCost = parseFloat(cost) || 0
            
            // 1. Add to incidents collection
            await addIncident(hotelId, {
                type,
                room: roomNumber,
                item: item.trim(),
                cost: finalCost,
                status,
                photo_url: '' // Mock
            })

            // 2. Create a shift note for the incident
            await addNote(hotelId, {
                category: type === 'damage' ? 'damage' : 'other',
                priority: 'high',
                content: `[Room ${roomNumber}] ${type.toUpperCase()}: ${item.trim()}${finalCost > 0 ? ` - Cost: ${finalCost} TRY` : ''}`,
                room_number: roomNumber,
                is_relevant: true,
                amount_due: finalCost > 0 ? finalCost : null,
                is_paid: status === 'paid',
                currency: 'TRY',
                created_by: 'system',
                created_by_name: 'Relay System',
                shift_id: null,
                is_anonymous: false
            })

            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
            >
                <div className="p-6 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Report Incident</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Room {roomNumber}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Incident Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['damage', 'theft'] as IncidentType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={cn(
                                        "px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-2",
                                        type === t 
                                            ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-lg shadow-rose-500/5" 
                                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {t === 'damage' ? <AlertTriangle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                    <span className="capitalize">{t}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Damaged/Missing Item</label>
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="e.g. TV Remote, Towel, Mirror"
                                value={item}
                                onChange={(e) => setItem(e.target.value)}
                                className="pl-10 h-11 bg-muted/30 border-border rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estimated Cost (TRY)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="pl-10 h-11 bg-muted/30 border-border rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Status</label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger className="h-11 bg-muted/30 border-border rounded-xl text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="pending_payment" className="text-xs">Pending</SelectItem>
                                    <SelectItem value="paid" className="text-xs">Paid</SelectItem>
                                    <SelectItem value="waived" className="text-xs">Waived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Camera className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-[11px] leading-tight text-amber-500/80">
                            <strong>Note:</strong> Photo evidence feature is available in the mobile app. For now, this will create a high-priority shift note.
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-muted/10 border-t border-border/40 flex gap-3">
                    <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading || !item.trim()} 
                        className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                    >
                        {loading ? "Processing..." : "Report Incident"}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
