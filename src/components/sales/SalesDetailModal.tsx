import { useState, useEffect } from 'react'
import {
    Calendar, Users, MapPin,
    MessageSquare, Edit3, Check, Trash2, Clock, Ticket
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSalesStore, saleTypeInfo, paymentStatusInfo, saleStatusInfo } from '@/stores/salesStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { Sale, Currency, SaleStatus } from '@/types'
import { cn, formatDisplayDate, getDateLocale } from '@/lib/utils'
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
    const { t } = useLanguageStore()
    const { sales, updateSale, deleteSale, collectPayment } = useSalesStore()

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Sale>>({})
    const [collectAmount, setCollectAmount] = useState('')
    const [paymentCurrency, setPaymentCurrency] = useState<Currency>('EUR')
    const [targetAmount, setTargetAmount] = useState('')

    const getCurrencySymbol = (currency: Currency) => {
        switch (currency) {
            case 'TRY': return '₺'
            case 'USD': return '$'
            case 'GBP': return '£'
            default: return '€'
        }
    }

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
                room_number: sale.room_number,
                currency: sale.currency,
                status: sale.status || 'waiting'
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
        if (confirm(t('sales.details.deleteConfirm'))) {
            await deleteSale(hotel.id, saleId)
            onClose()
        }
    }

    const remaining = sale.total_price - sale.collected_amount
    const dateLocale = getDateLocale()

    return (
        <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border text-foreground max-w-2xl p-0 overflow-hidden">
                <DialogTitle className="sr-only">{t('module.sales')} - {sale.name}</DialogTitle>
                <DialogDescription className="sr-only">View and edit sale details</DialogDescription>
                <div className="flex flex-col h-[80vh] md:h-auto overflow-y-auto">
                    {/* H E A D E R */}
                    <div className={cn("p-6 border-b border-border relative overflow-hidden", saleTypeInfo[sale.type].color.split(" ")[0].replace('/20', '/10'))}>
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
                                        <Check className="w-4 h-4 mr-1" /> {t('sales.details.save')}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>{t('sales.details.cancel')}</Button>
                                </>
                            )}

                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{saleTypeInfo[sale.type].icon}</span>
                            <Badge variant="outline" className={cn(saleTypeInfo[sale.type].color)}>
                                {t(saleTypeInfo[sale.type].label as any)}
                            </Badge>
                            <Badge variant="outline" className={cn(paymentStatusInfo[sale.payment_status].color)}>
                                {t(paymentStatusInfo[sale.payment_status].label as any)}
                            </Badge>

                            {/* Status Selector */}
                            {isEditing ? (
                                <Select
                                    value={editForm.status || 'waiting'}
                                    onValueChange={(v: SaleStatus) => setEditForm(prev => ({ ...prev, status: v }))}
                                >
                                    <SelectTrigger className="h-6 w-[120px] text-xs bg-background border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(saleStatusInfo).map(([status, info]) => (
                                            <SelectItem key={status} value={status}>
                                                {t(info.label as any)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                sale.status && (
                                    <Badge variant="outline" className={cn(
                                        saleStatusInfo[sale.status]?.color || "bg-muted text-muted-foreground border-border"
                                    )}>
                                        {sale.status ? t(saleStatusInfo[sale.status].label as any) : sale.status}
                                    </Badge>
                                )
                            )}
                        </div>

                        {isEditing ? (
                            <Input
                                value={editForm.name}
                                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="text-2xl font-bold bg-background/50 border-border text-foreground mb-2"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-foreground mb-1">{sale.name}</h2>
                        )}

                        <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {sale.customer_name}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {t('common.room')} {sale.room_number}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDisplayDate(sale.date)}</span>
                        </div>
                    </div>

                    {/* C O N T E N T */}
                    <div className="p-6 space-y-8">

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('sales.details.service')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{t('sales.details.pickup')}</label>
                                        {isEditing ? (
                                            <Input
                                                type="time"
                                                value={editForm.pickup_time}
                                                onChange={e => setEditForm(prev => ({ ...prev, pickup_time: e.target.value }))}
                                                className="h-8 bg-background border-border"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                {sale.pickup_time || t('sales.details.notSet')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{t('sales.details.ticket')}</label>
                                        {isEditing ? (
                                            <Input
                                                value={editForm.ticket_number}
                                                onChange={e => setEditForm(prev => ({ ...prev, ticket_number: e.target.value }))}
                                                className="h-8 bg-background border-border"
                                                placeholder={t('sales.details.ticketPlaceholder')}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Ticket className="w-4 h-4 text-muted-foreground" />
                                                {sale.ticket_number || t('sales.details.none')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{t('sales.details.pax')}</label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={editForm.pax}
                                                onChange={e => setEditForm(prev => ({ ...prev, pax: parseInt(e.target.value) || 1 }))}
                                                className="h-8 bg-background border-border"
                                            />
                                        ) : (
                                            <div className="text-sm font-medium">{sale.pax} {sale.pax > 1 ? t('sales.details.persons') : t('sales.details.person')}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('sales.details.financials')}</h3>
                                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">{t('sales.details.total')}</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    value={editForm.total_price}
                                                    onChange={e => setEditForm(prev => ({ ...prev, total_price: parseFloat(e.target.value) || 0 }))}
                                                    className="h-7 w-20 text-right bg-background border-border"
                                                />
                                                {sale.type === 'laundry' ? (
                                                    <span className="text-xs text-muted-foreground">₺</span>
                                                ) : (
                                                    <Select
                                                        value={editForm.currency}
                                                        onValueChange={(v: Currency) => setEditForm(prev => ({ ...prev, currency: v }))}
                                                    >
                                                        <SelectTrigger className="h-7 w-16 text-[10px] bg-background border-border">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="EUR">EUR</SelectItem>
                                                            <SelectItem value="TRY">TRY</SelectItem>
                                                            <SelectItem value="USD">USD</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-foreground">
                                                {getCurrencySymbol(sale.currency)}{sale.total_price}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-muted-foreground">{t('sales.details.paid')}</span>
                                        <span className={cn("text-sm font-medium", sale.collected_amount >= sale.total_price ? "text-emerald-500" : "text-amber-500")}>
                                            {getCurrencySymbol(sale.currency)}{sale.collected_amount}
                                        </span>
                                    </div>

                                    {remaining > 0 && (
                                        <div className="pt-3 border-t border-border space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 relative">
                                                    <Input
                                                        value={collectAmount}
                                                        onChange={e => setCollectAmount(e.target.value)}
                                                        placeholder={t('sales.details.amountPlaceholder')}
                                                        type="number"
                                                        className="h-8 bg-background border-border text-xs pl-2"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Select
                                                        value={paymentCurrency}
                                                        onValueChange={(v: Currency) => setPaymentCurrency(v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs bg-background border-border">
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
                                                            placeholder={t('sales.details.valuePlaceholder', { currency: sale.currency })}
                                                            type="number"
                                                            className="h-8 bg-background border-amber-500/30 text-xs pl-2"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground font-bold">{sale.currency}</span>
                                                    </div>
                                                    <div className="w-24 flex items-center justify-center text-[10px] text-amber-500 font-medium leading-tight text-center">
                                                        {t('sales.details.exchange')}
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                size="sm"
                                                onClick={handleCollect}
                                                disabled={!collectAmount || (paymentCurrency !== sale.currency && !targetAmount)}
                                                className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 mt-2"
                                            >
                                                {t('sales.details.collect')}
                                            </Button>

                                            <p className="text-[10px] text-muted-foreground text-right">{t('sales.details.remaining')}: <span className="text-rose-500 font-bold">{getCurrencySymbol(sale.currency)}{remaining.toFixed(2)}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> {t('sales.details.notes')}
                            </h3>
                            {isEditing ? (
                                <Textarea
                                    value={editForm.notes}
                                    onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="bg-background border-border min-h-[100px]"
                                    placeholder={t('sales.details.notesPlaceholder')}
                                />
                            ) : (
                                <div className="p-4 bg-muted/30 rounded-xl border border-border min-h-[80px]">
                                    {sale.notes ? (
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{sale.notes}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">{t('sales.details.noNotes')}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment History */}
                        {sale.payments && sale.payments.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('sales.details.history')}</h3>
                                <div className="space-y-2">
                                    {sale.payments.map((payment, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-muted-foreground">{format(new Date(payment.timestamp), 'dd MMM HH:mm', { locale: dateLocale })}</span>
                                            </div>
                                            <span className="font-medium text-emerald-500">+{payment.amount} {payment.currency}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-[10px] text-muted-foreground pt-4 border-t border-border text-center">
                            {t('sales.details.created', {
                                name: sale.created_by_name,
                                date: format(new Date(sale.created_at), 'PPP p', { locale: dateLocale })
                            })}
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
