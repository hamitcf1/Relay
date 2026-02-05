import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    Plus, X, Check, MapPin, Truck, ShoppingBag,
    CreditCard, AlertCircle, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSalesStore, saleTypeInfo, paymentStatusInfo, type SaleType, type Sale } from '@/stores/salesStore'
import { useTourStore } from '@/stores/tourStore'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useCalendarStore } from '@/stores/calendarStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'

export function SalesPanel() {
    const { sales, loading, subscribeToSales, addSale, collectPayment, deleteSale } = useSalesStore()
    const { tours, subscribeToTours } = useTourStore()
    const { addEvent } = useCalendarStore()
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()

    const [activeTab, setActiveTab] = useState<SaleType>('tour')
    const [isAdding, setIsAdding] = useState(false)
    const [collectingId, setCollectingId] = useState<string | null>(null)
    const [collectAmount, setCollectAmount] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        customer_name: '',
        room_number: '',
        pax: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        total_price: '',
        collected_amount: '0',
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
            total_price: '',
            collected_amount: '0',
            notes: ''
        })
        setIsAdding(false)
    }

    const handleAddSale = async () => {
        if (!hotel?.id || !user || !formData.name.trim() || !formData.total_price) return

        const saleDate = new Date(formData.date)
        const totalPrice = parseFloat(formData.total_price)
        const collectedAmount = parseFloat(formData.collected_amount) || 0

        // Create sale
        await addSale(hotel.id, {
            type: activeTab,
            name: formData.name.trim(),
            customer_name: formData.customer_name.trim(),
            room_number: formData.room_number.trim(),
            pax: formData.pax,
            date: saleDate,
            total_price: totalPrice,
            collected_amount: collectedAmount,
            currency: 'EUR',
            notes: formData.notes.trim() || undefined,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown'
        })

        // Auto-create calendar event
        await addEvent(hotel.id, {
            type: activeTab === 'tour' ? 'tour' : 'transfer',
            title: `${saleTypeInfo[activeTab].icon} ${formData.name} - Oda ${formData.room_number}`,
            description: `Misafir: ${formData.customer_name}\nPax: ${formData.pax}\nÜcret: ${totalPrice}€`,
            date: saleDate,
            time: null,
            room_number: formData.room_number,
            total_price: totalPrice,
            collected_amount: collectedAmount,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown'
        })

        resetForm()
    }

    const handleCollect = async (sale: Sale) => {
        if (!hotel?.id || !collectAmount) return
        const amount = parseFloat(collectAmount)
        if (isNaN(amount) || amount <= 0) return

        await collectPayment(hotel.id, sale.id, amount)
        setCollectingId(null)
        setCollectAmount('')
    }

    const handleDelete = async (saleId: string) => {
        if (!hotel?.id) return
        if (confirm('Bu satışı silmek istediğinizden emin misiniz?')) {
            await deleteSale(hotel.id, saleId)
        }
    }

    const tabs: { type: SaleType; icon: React.ReactNode }[] = [
        { type: 'tour', icon: <MapPin className="w-4 h-4" /> },
        { type: 'transfer', icon: <Truck className="w-4 h-4" /> },
        { type: 'laundry', icon: <ShoppingBag className="w-4 h-4" /> }
    ]

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        Satış Takibi
                    </CardTitle>
                    {!isAdding && (
                        <Button
                            size="sm"
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Satış
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
                                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                                activeTab === type
                                    ? 'bg-zinc-700 text-white'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            )}
                        >
                            {icon}
                            {saleTypeInfo[type].label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Add Sale Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-indigo-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-white">
                                        Yeni {saleTypeInfo[activeTab].label} Satışı
                                    </h4>
                                    <button onClick={resetForm} className="text-zinc-500 hover:text-zinc-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">
                                            {activeTab === 'tour' ? 'Tur Adı' : activeTab === 'transfer' ? 'Varış Noktası' : 'Açıklama'}
                                        </label>
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
                                                <SelectTrigger className="bg-zinc-950 border-zinc-700">
                                                    <SelectValue placeholder="Tur Seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tours.filter(t => t.is_active).map(t => (
                                                        <SelectItem key={t.id} value={t.name}>
                                                            {t.name} ({t.adult_price}€)
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="other">Diğer / Özel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="bg-zinc-950 border-zinc-700"
                                                placeholder={activeTab === 'transfer' ? 'Havalimanı' : 'Çamaşır Yıkama'}
                                            />
                                        )}
                                        {formData.name === 'other' && activeTab === 'tour' && (
                                            <Input
                                                placeholder="Tur adını girin..."
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="mt-2 bg-zinc-950 border-zinc-700"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Misafir Adı</label>
                                        <Input
                                            value={formData.customer_name}
                                            onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-700"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Oda No</label>
                                        <Input
                                            value={formData.room_number}
                                            onChange={e => setFormData(p => ({ ...p, room_number: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-700"
                                            placeholder="305"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Kişi Sayısı (PAX)</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.pax}
                                            onChange={e => setFormData(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))}
                                            className="bg-zinc-950 border-zinc-700"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Tarih</label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-700"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Toplam Ücret (€)</label>
                                        <Input
                                            type="number"
                                            value={formData.total_price}
                                            onChange={e => setFormData(p => ({ ...p, total_price: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-700"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Alınan Ödeme (€)</label>
                                        <Input
                                            type="number"
                                            value={formData.collected_amount}
                                            onChange={e => setFormData(p => ({ ...p, collected_amount: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-700"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Notlar (Opsiyonel)</label>
                                        <Input
                                            value={formData.notes}
                                            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-700"
                                            placeholder="Ek bilgi..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={handleAddSale}
                                        disabled={!formData.name.trim() || !formData.total_price}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                                    >
                                        <Check className="w-4 h-4 mr-1" />
                                        Kaydet
                                    </Button>
                                    <Button variant="ghost" onClick={resetForm}>
                                        İptal
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
                        <div className="text-4xl mb-2">{saleTypeInfo[activeTab].icon}</div>
                        <p className="text-zinc-500 text-sm">Henüz {saleTypeInfo[activeTab].label.toLowerCase()} satışı yok.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredSales.map(sale => {
                            const remaining = sale.total_price - sale.collected_amount
                            const statusInfo = paymentStatusInfo[sale.payment_status]

                            return (
                                <motion.div
                                    key={sale.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        'p-3 rounded-xl border transition-all',
                                        sale.payment_status === 'paid'
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : sale.payment_status === 'partial'
                                                ? 'bg-amber-500/5 border-amber-500/20'
                                                : 'bg-rose-500/5 border-rose-500/20'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{saleTypeInfo[sale.type].icon}</span>
                                                <span className="font-medium text-white truncate">{sale.name}</span>
                                                <Badge variant="outline" className={cn('text-[9px] px-1.5', statusInfo.color)}>
                                                    {statusInfo.label}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                                                <span>Oda {sale.room_number}</span>
                                                <span>•</span>
                                                <span>{sale.customer_name}</span>
                                                <span>•</span>
                                                <span>{sale.pax} kişi</span>
                                                <span>•</span>
                                                <span>{format(sale.date, 'd MMM', { locale: tr })}</span>
                                            </div>

                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="text-sm">
                                                    <span className="text-zinc-500">Ödeme:</span>
                                                    <span className={cn(
                                                        'ml-1 font-bold',
                                                        sale.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                                                    )}>
                                                        {sale.collected_amount} / {sale.total_price} €
                                                    </span>
                                                </div>

                                                {remaining > 0 && (
                                                    <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-400">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Kalan: {remaining}€
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            {sale.payment_status !== 'paid' && (
                                                collectingId === sale.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <Input
                                                            type="number"
                                                            value={collectAmount}
                                                            onChange={e => setCollectAmount(e.target.value)}
                                                            className="w-16 h-7 text-xs bg-zinc-950 border-zinc-700"
                                                            placeholder="€"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleCollect(sale)}
                                                            className="p-1 text-emerald-500 hover:text-emerald-400"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setCollectingId(null); setCollectAmount('') }}
                                                            className="p-1 text-zinc-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setCollectingId(sale.id)}
                                                        className="h-7 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                    >
                                                        <CreditCard className="w-3 h-3 mr-1" />
                                                        Tahsil Et
                                                    </Button>
                                                )
                                            )}
                                            <button
                                                onClick={() => handleDelete(sale.id)}
                                                className="text-[10px] text-zinc-600 hover:text-rose-400 transition-colors"
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
