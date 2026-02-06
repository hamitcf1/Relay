import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
    Plus, X, Check, MapPin, Truck, ShoppingBag,
    CreditCard, Loader2, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatDisplayDate } from '@/lib/utils'
import { useSalesStore, saleTypeInfo, paymentStatusInfo, saleStatusInfo } from '@/stores/salesStore'
import { useTourStore } from '@/stores/tourStore'
import { SalesDetailModal } from './SalesDetailModal'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import type { SaleType, Currency, SaleStatus } from '@/types'

export function SalesPanel() {
    const { sales, loading, subscribeToSales, addSale, updateSale } = useSalesStore()
    const { tours, subscribeToTours } = useTourStore()
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()

    const [activeTab, setActiveTab] = useState<SaleType>('tour')
    const [isAdding, setIsAdding] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        customer_name: '',
        room_number: '',
        pax: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        pickup_time: '',
        total_price: '',
        currency: 'EUR' as Currency,
        notes: ''
    })

    useEffect(() => {
        if (!hotel?.id) return
        const unsubSales = subscribeToSales(hotel.id)
        const unsubTours = subscribeToTours(hotel.id)
        return () => {
            unsubSales()
            unsubTours()
        }
    }, [hotel?.id, subscribeToSales, subscribeToTours])

    const filteredSales = sales.filter(s => s.type === activeTab)

    const resetForm = () => {
        setFormData({
            name: '',
            customer_name: '',
            room_number: '',
            pax: 1,
            date: format(new Date(), 'yyyy-MM-dd'),
            pickup_time: '',
            total_price: '',
            currency: 'EUR',
            notes: ''
        })
        setIsAdding(false)
    }

    const handleAddSale = async () => {
        if (!hotel?.id || !user || !formData.name.trim() || !formData.total_price) return

        const saleDate = new Date(formData.date)
        const totalPrice = parseFloat(formData.total_price)

        await addSale(hotel.id, {
            type: activeTab,
            name: formData.name.trim(),
            customer_name: formData.customer_name.trim(),
            room_number: formData.room_number.trim(),
            pax: formData.pax,
            date: saleDate,
            pickup_time: formData.pickup_time || undefined,
            total_price: totalPrice,
            currency: formData.currency,
            notes: formData.notes.trim() || '',
            created_by: user.uid,
            created_by_name: user.name || 'Unknown'
        })

        resetForm()
    }

    const tabs: { type: SaleType; icon: React.ReactNode }[] = [
        { type: 'tour', icon: <MapPin className="w-4 h-4" /> },
        { type: 'transfer', icon: <Truck className="w-4 h-4" /> },
        { type: 'laundry', icon: <ShoppingBag className="w-4 h-4" /> }
    ]

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        Sales Tracker
                    </CardTitle>
                    {!isAdding && (
                        <Button
                            size="sm"
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 gap-1 h-8 text-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Sale
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-3 p-1 bg-zinc-800/50 rounded-lg">
                    {tabs.map(({ type, icon }) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all',
                                activeTab === type
                                    ? 'bg-zinc-700 text-white shadow-sm'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                            )}
                        >
                            {icon}
                            {saleTypeInfo[type].label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 overflow-y-auto custom-scrollbar p-3">
                {/* Add Sale Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-4"
                        >
                            <div className="p-3 bg-zinc-800/80 rounded-xl border border-indigo-500/30 space-y-3 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                        New {saleTypeInfo[activeTab].label}
                                    </h4>
                                    <button onClick={resetForm} className="text-zinc-500 hover:text-zinc-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Service</label>
                                        {activeTab === 'tour' ? (
                                            <Select
                                                value={formData.name}
                                                onValueChange={(value) => {
                                                    const selectedTour = tours.find(t => t.name === value)
                                                    setFormData(p => ({
                                                        ...p,
                                                        name: value,
                                                        total_price: selectedTour ? selectedTour.adult_price.toString() : p.total_price
                                                    }))
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-700">
                                                    <SelectValue placeholder="Select Tour" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[...tours].filter(t => t.is_active).sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                                                        <SelectItem key={t.id} value={t.name}>
                                                            {t.name} (€{t.adult_price})
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="other">Other / Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                                placeholder={activeTab === 'transfer' ? 'Destination (e.g. Airport)' : 'Description'}
                                            />
                                        )}
                                        {formData.name === 'other' && activeTab === 'tour' && (
                                            <Input
                                                placeholder="Enter custom tour name..."
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="h-8 text-xs mt-2 bg-zinc-950 border-zinc-700"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Guest Name</label>
                                        <Input
                                            value={formData.customer_name}
                                            onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Room #</label>
                                        <Input
                                            value={formData.room_number}
                                            onChange={e => setFormData(p => ({ ...p, room_number: e.target.value }))}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                            placeholder="101"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Pax</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.pax}
                                            onChange={e => setFormData(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Date</label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Pickup Time</label>
                                        <Input
                                            type="time"
                                            value={formData.pickup_time}
                                            onChange={e => setFormData(p => ({ ...p, pickup_time: e.target.value }))}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                        />
                                    </div>

                                    <div className="space-y-1 relative">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Price</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={formData.total_price}
                                                onChange={e => setFormData(p => ({ ...p, total_price: e.target.value }))}
                                                className="h-8 text-xs bg-zinc-950 border-zinc-700 pl-6"
                                                placeholder="0"
                                            />
                                            <span className="absolute left-2 top-2 text-xs text-zinc-500">€</span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Notes</label>
                                        <Input
                                            value={formData.notes}
                                            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-700"
                                            placeholder="Optional notes..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={handleAddSale}
                                        disabled={!formData.name.trim() || !formData.total_price}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 h-8 text-xs"
                                    >
                                        <Check className="w-3.5 h-3.5 mr-1" />
                                        Create Sale
                                    </Button>
                                    <Button variant="ghost" onClick={resetForm} className="h-8 text-xs">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sales List */}
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="text-4xl mb-2 opacity-20 text-zinc-600">{saleTypeInfo[activeTab].icon}</div>
                        <p className="text-zinc-500 text-sm">No {saleTypeInfo[activeTab].label.toLowerCase()} sales yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredSales.map(sale => {
                            const remaining = sale.total_price - sale.collected_amount

                            return (
                                <motion.div
                                    key={sale.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => setSelectedSaleId(sale.id)}
                                    className={cn(
                                        'group p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]',
                                        sale.payment_status === 'paid'
                                            ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
                                            : sale.payment_status === 'partial'
                                                ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30'
                                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg group-hover:scale-110 transition-transform">{saleTypeInfo[sale.type].icon}</span>
                                                <span className="font-semibold text-zinc-200 truncate">{sale.name}</span>
                                                {remaining > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                                                <span className="bg-zinc-950/50 px-1.5 py-0.5 rounded border border-zinc-800">Rm {sale.room_number}</span>
                                                <span>{sale.customer_name}</span>
                                                <span className="text-zinc-600">•</span>
                                                <span>{formatDisplayDate(sale.date)}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">€{sale.total_price}</div>
                                            <div className={cn("text-[10px] font-medium", paymentStatusInfo[sale.payment_status].color.replace('bg-', 'text-').split(' ')[1])}>
                                                {paymentStatusInfo[sale.payment_status].label}
                                            </div>
                                            {/* Detailed Status Badge */}
                                            {/* Detailed Status Select */}
                                            <div onClick={(e) => e.stopPropagation()} className="mt-1">
                                                <Select
                                                    value={sale.status || 'waiting'}
                                                    onValueChange={(val: any) => {
                                                        if (hotel?.id) {
                                                            updateSale(hotel.id, sale.id, { status: val })
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-5 text-[9px] px-1.5 py-0 border-none min-w-[70px] justify-between gap-1 transition-colors",
                                                        saleStatusInfo[sale.status as SaleStatus]?.color || "bg-zinc-800 text-zinc-400"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent align="end">
                                                        {(Object.keys(saleStatusInfo) as SaleStatus[]).map((status) => (
                                                            <SelectItem key={status} value={status} className="text-xs">
                                                                {saleStatusInfo[status].label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </CardContent>

            <SalesDetailModal
                saleId={selectedSaleId}
                onClose={() => setSelectedSaleId(null)}
            />
        </Card>
    )
}
