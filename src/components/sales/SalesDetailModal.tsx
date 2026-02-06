import { useState, useEffect } from 'react'
import {
    X, Calendar, Users, MapPin,
    MessageSquare, Edit3, Check, Trash2, Clock, Ticket
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useSalesStore, saleTypeInfo, paymentStatusInfo } from '@/stores/salesStore'
import { useHotelStore } from '@/stores/hotelStore'
import type { Sale, Currency } from '@/types'
import { cn, formatDisplayDate } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Inline Textarea to avoid missing component
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            props.className
        )}
    />
)

interface SalesDetailModalProps {
    saleId: string | null
    onClose: () => void
}

export function SalesDetailModal({ saleId, onClose }: SalesDetailModalProps) {
    const { hotel } = useHotelStore()
    const { sales, updateSale, deleteSale, collectPayment } = useSalesStore()

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Sale>>({})
    const [collectAmount, setCollectAmount] = useState('')
    const [paymentCurrency, setPaymentCurrency] = useState<Currency>('EUR')
    const [targetAmount, setTargetAmount] = useState('')

    const sale = sales.find(s => s.id === saleId)

    useEffect(() => {
        if (sale) {
            setEditForm({
                total_price: sale.total_price,
                pax: sale.pax,
                notes: sale.notes || '',
                pickup_time: sale.pickup_time || '',
                ticket_number: sale.ticket_number || '',
                date: sale.date,
                name: sale.name,
                room_number: sale.room_number
            })
            // Reset payment currency to sale currency by default
            setPaymentCurrency(sale.currency)
            setCollectAmount('')
            setTargetAmount('')
        }
    }, [sale])

    if (!sale) return null

    const handleSave = async () => {
        if (!hotel?.id || !saleId) return
        try {
            await updateSale(hotel.id, saleId, editForm)
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update sale:", error)
        }
    }

    const handleCollect = async () => {
        if (!hotel?.id || !saleId || !collectAmount) return
        const amount = parseFloat(collectAmount)
        if (isNaN(amount) || amount <= 0) return

        let equivalentValue: number | undefined = undefined
        if (paymentCurrency !== sale.currency) {
            const tAmount = parseFloat(targetAmount)
            if (!isNaN(tAmount) && tAmount > 0) {
                equivalentValue = tAmount
            } else {
                return // Must specify exchange value
            }
        }

        try {
            await collectPayment(hotel.id, saleId, amount, paymentCurrency, equivalentValue)
            setCollectAmount('')
            setTargetAmount('')
        } catch (error) {
            console.error("Payment collection error:", error)
        }
    }

    const handleDelete = async () => {
        if (!hotel?.id || !saleId) return
        if (confirm("Are you sure you want to completely delete this sale record?")) {
            await deleteSale(hotel.id, saleId)
            onClose()
        }
    }

    const remaining = sale.total_price - sale.collected_amount

    return (
        <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl p-0 overflow-hidden">
                <div className="flex flex-col h-[80vh] md:h-auto overflow-y-auto">
                    {/* H E A D E R */}
                    <div className={cn("p-6 border-b border-zinc-800 relative overflow-hidden", saleTypeInfo[sale.type].color.split(" ")[0].replace('/20', '/10'))}>
                        <div className="absolute top-0 right-0 p-4 flex items-center gap-2">
                            {!isEditing ? (
                                <>
                                    <Button size="icon" variant="ghost" className="hover:bg-white/10" onClick={() => setIsEditing(true)}>
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" onClick={handleDelete}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={handleSave}>
                                        <Check className="w-4 h-4 mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                </>
                            )}
                            <Button size="icon" variant="ghost" onClick={onClose} className="ml-2">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{saleTypeInfo[sale.type].icon}</span>
                            <Badge variant="outline" className={cn(saleTypeInfo[sale.type].color)}>
                                {saleTypeInfo[sale.type].label}
                            </Badge>
                            <Badge variant="outline" className={cn(paymentStatusInfo[sale.payment_status].color)}>
                                {paymentStatusInfo[sale.payment_status].label}
                            </Badge>
                        </div>

                        {isEditing ? (
                            <Input
                                value={editForm.name}
                                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="text-2xl font-bold bg-black/20 border-white/10 text-white mb-2"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-white mb-1">{sale.name}</h2>
                        )}

                        <div className="flex items-center gap-4 text-zinc-400 text-sm">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {sale.customer_name}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Room {sale.room_number}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDisplayDate(sale.date)}</span>
                        </div>
                    </div>

                    {/* C O N T E N T */}
                    <div className="p-6 space-y-8">

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Service Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Pickup Time</label>
                                        {isEditing ? (
                                            <Input
                                                type="time"
                                                value={editForm.pickup_time}
                                                onChange={e => setEditForm(prev => ({ ...prev, pickup_time: e.target.value }))}
                                                className="h-8 bg-zinc-900 border-zinc-800"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Clock className="w-4 h-4 text-zinc-600" />
                                                {sale.pickup_time || 'Not set'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Ticket #</label>
                                        {isEditing ? (
                                            <Input
                                                value={editForm.ticket_number}
                                                onChange={e => setEditForm(prev => ({ ...prev, ticket_number: e.target.value }))}
                                                className="h-8 bg-zinc-900 border-zinc-800"
                                                placeholder="e.g. T-12345"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Ticket className="w-4 h-4 text-zinc-600" />
                                                {sale.ticket_number || 'None'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Pax</label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={editForm.pax}
                                                onChange={e => setEditForm(prev => ({ ...prev, pax: parseInt(e.target.value) || 1 }))}
                                                className="h-8 bg-zinc-900 border-zinc-800"
                                            />
                                        ) : (
                                            <div className="text-sm font-medium">{sale.pax} Person(s)</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Financials</h3>
                                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-zinc-400">Total Price</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 w-24">
                                                <Input
                                                    type="number"
                                                    value={editForm.total_price}
                                                    onChange={e => setEditForm(prev => ({ ...prev, total_price: parseFloat(e.target.value) || 0 }))}
                                                    className="h-7 text-right bg-zinc-950 border-zinc-700"
                                                />
                                                <span className="text-xs text-zinc-500">€</span>
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-white">€{sale.total_price}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-zinc-400">Paid So Far</span>
                                        <span className={cn("text-sm font-medium", sale.collected_amount >= sale.total_price ? "text-emerald-400" : "text-amber-400")}>
                                            €{sale.collected_amount}
                                        </span>
                                    </div>

                                    {remaining > 0 && (
                                        <div className="pt-3 border-t border-zinc-800 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 relative">
                                                    <Input
                                                        value={collectAmount}
                                                        onChange={e => setCollectAmount(e.target.value)}
                                                        placeholder="Amount..."
                                                        type="number"
                                                        className="h-8 bg-zinc-950 border-zinc-700 text-xs pl-2"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Select
                                                        value={paymentCurrency}
                                                        onValueChange={(v: Currency) => setPaymentCurrency(v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-700">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                                            <SelectItem value="TRY">TRY (₺)</SelectItem>
                                                            <SelectItem value="USD">USD ($)</SelectItem>
                                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {paymentCurrency !== sale.currency && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            value={targetAmount}
                                                            onChange={e => setTargetAmount(e.target.value)}
                                                            placeholder={`Value in ${sale.currency}...`}
                                                            type="number"
                                                            className="h-8 bg-zinc-950 border-amber-500/30 text-xs pl-2"
                                                        />
                                                        <span className="absolute right-2 top-2 text-[10px] text-zinc-500 font-bold">{sale.currency}</span>
                                                    </div>
                                                    <div className="w-24 flex items-center justify-center text-[10px] text-amber-500 font-medium">
                                                        Exchange Value
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                size="sm"
                                                onClick={handleCollect}
                                                disabled={!collectAmount || (paymentCurrency !== sale.currency && !targetAmount)}
                                                className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 mt-2"
                                            >
                                                Collect Payment
                                            </Button>

                                            <p className="text-[10px] text-zinc-500 text-right">Remaining: <span className="text-rose-400 font-bold">€{remaining.toFixed(2)}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> Notes
                            </h3>
                            {isEditing ? (
                                <Textarea
                                    value={editForm.notes}
                                    onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                                    placeholder="Add notes about pickup location, preferences, etc."
                                />
                            ) : (
                                <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50 min-h-[80px]">
                                    {sale.notes ? (
                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{sale.notes}</p>
                                    ) : (
                                        <p className="text-sm text-zinc-600 italic">No notes added.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment History */}
                        {sale.payments && sale.payments.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment History</h3>
                                <div className="space-y-2">
                                    {sale.payments.map((payment, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-zinc-400">{format(new Date(payment.timestamp), 'dd MMM HH:mm')}</span>
                                            </div>
                                            <span className="font-medium text-emerald-400">+{payment.amount} {payment.currency}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-[10px] text-zinc-600 pt-4 border-t border-zinc-900 text-center">
                            Created by {sale.created_by_name} on {format(new Date(sale.created_at), 'PPP p')}
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
