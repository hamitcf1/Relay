import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, MapPin, Truck, ShoppingBag, CreditCard, Loader2, X, Check } from 'lucide-react'
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
import { useLanguageStore } from '@/stores/languageStore'
import { useNotesStore } from '@/stores/notesStore'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SaleType, Currency, SaleStatus } from '@/types'

export function SalesPanel() {
    const { t } = useLanguageStore()
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

    const [laundryData, setLaundryData] = useState({
        whites: 0,
        colors: 0,
        ironingPieces: 0,
        service: 'washing' as 'washing' | 'ironing' | 'washing_ironing'
    })

    const [transferData, setTransferData] = useState({
        destination: '',
        pickupLocation: '',
        flightNumber: '',
        restAmount: ''
    })

    const [hotelInfo, setHotelInfo] = useState<any>(null)
    const [shouldAddToNotes, setShouldAddToNotes] = useState(true)
    const { addNote } = useNotesStore()

    useEffect(() => {
        if (!hotel?.id) return
        const unsubSales = subscribeToSales(hotel.id)
        const unsubTours = subscribeToTours(hotel.id)

        // Fetch prices
        getDoc(doc(db, 'hotels', hotel.id, 'settings', 'info')).then(snap => {
            if (snap.exists()) setHotelInfo(snap.data())
        })

        return () => {
            unsubSales()
            unsubTours()
        }
    }, [hotel?.id, subscribeToSales, subscribeToTours])

    // Auto-calculate Laundry Price
    useEffect(() => {
        if (activeTab === 'laundry' && hotelInfo) {
            const colorMachines = Math.ceil(laundryData.colors / 8);
            const whiteMachines = Math.ceil(laundryData.whites / 8);
            const totalMachines = colorMachines + whiteMachines;

            const laundryBase = (laundryData.service !== 'ironing') ? totalMachines * (hotelInfo.laundry_price || 0) : 0;
            const ironingTotal = (laundryData.service !== 'washing') ? laundryData.ironingPieces * (hotelInfo.ironing_price || 0) : 0;

            const total = laundryBase + ironingTotal;
            if (total > 0) {
                setFormData(p => ({ ...p, total_price: total.toString() }));
            }
        }
    }, [laundryData.colors, laundryData.whites, laundryData.ironingPieces, laundryData.service, activeTab, hotelInfo])

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
        setLaundryData({
            whites: 0,
            colors: 0,
            ironingPieces: 0,
            service: 'washing'
        })
        setTransferData({
            destination: '',
            pickupLocation: '',
            flightNumber: '',
            restAmount: ''
        })
        setIsAdding(false)
    }

    const handleAddSale = async () => {
        const isLaundry = activeTab === 'laundry'
        const isTransfer = activeTab === 'transfer'

        const finalName = isLaundry ? t('sales.type.laundry') : (isTransfer ? transferData.destination : formData.name.trim())
        if (!hotel?.id || !user || !finalName || !formData.total_price) return

        const saleDate = new Date(formData.date)
        const totalPrice = parseFloat(formData.total_price)

        let finalNotes = formData.notes.trim()
        if (isLaundry) {
            const washingType = laundryData.service === 'ironing'
                ? t('sales.laundry.ironing')
                : (laundryData.service === 'washing_ironing' ? t('sales.laundry.washingAndIroning') : t('sales.laundry.washing'))
            const whitesInfo = laundryData.whites > 0 ? t('sales.laundry.itemsCount', { count: laundryData.whites.toString(), type: t('sales.laundry.whites') }) : ''
            const colorsInfo = laundryData.colors > 0 ? t('sales.laundry.itemsCount', { count: laundryData.colors.toString(), type: t('sales.laundry.colors') }) : ''
            const ironingInfo = laundryData.ironingPieces > 0 ? `${laundryData.ironingPieces} ${t('sales.laundry.ironingPieces')}` : ''
            finalNotes = [washingType, colorsInfo, whitesInfo, ironingInfo, finalNotes].filter(Boolean).join(' | ')
        } else if (isTransfer) {
            const transferInfo = [
                transferData.pickupLocation ? `${t('sales.transfer.pickup')}: ${transferData.pickupLocation}` : '',
                transferData.flightNumber ? `${t('sales.transfer.flight')}: ${transferData.flightNumber}` : '',
                transferData.restAmount ? `${t('sales.transfer.rest')}: ${transferData.restAmount}` : ''
            ].filter(Boolean).join(' | ')
            finalNotes = [transferInfo, finalNotes].filter(Boolean).join('\n')
        }

        await addSale(hotel.id, {
            type: activeTab,
            name: finalName,
            customer_name: formData.customer_name.trim(),
            room_number: formData.room_number.trim(),
            pax: formData.pax,
            date: saleDate,
            pickup_time: formData.pickup_time || null,
            total_price: totalPrice,
            currency: isLaundry ? 'TRY' : formData.currency,
            notes: finalNotes,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown'
        })

        // Also add to Shift Notes if enabled
        if (shouldAddToNotes) {
            const noteContent = `${finalName} - Room ${formData.room_number}: ${totalPrice} ${isLaundry ? 'TRY' : formData.currency}${finalNotes ? ` (${finalNotes.replace(/\n/g, ' ')})` : ''}`
            await addNote(hotel.id, {
                category: 'upsell',
                content: noteContent,
                room_number: formData.room_number.trim(),
                is_relevant: true,
                created_by: user.uid,
                created_by_name: user.name || 'Staff',
                guest_name: formData.customer_name.trim(),
                shift_id: null,
                amount_due: totalPrice,
                is_paid: false
            })
        }

        resetForm()
    }

    const tabs: { type: SaleType; icon: React.ReactNode }[] = [
        { type: 'tour', icon: <MapPin className="w-4 h-4" /> },
        { type: 'transfer', icon: <Truck className="w-4 h-4" /> },
        { type: 'laundry', icon: <ShoppingBag className="w-4 h-4" /> }
    ]

    return (
        <Card className="bg-card/50 border-border h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('sales.tracker')}
                    </CardTitle>
                    {!isAdding && (
                        <Button
                            size="sm"
                            onClick={() => setIsAdding(true)}
                            className="bg-primary hover:bg-primary/90 gap-1 h-8 text-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t('sales.new')}
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-3 p-1 bg-muted rounded-lg">
                    {tabs.map(({ type, icon }) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all',
                                activeTab === type
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            )}
                        >
                            {icon}
                            {t(saleTypeInfo[type].label as any)}
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
                            <div className="p-3 bg-card rounded-xl border border-primary/30 space-y-3 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        {t('sales.newType', { label: t(saleTypeInfo[activeTab].label as any) })}
                                    </h4>
                                    <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.service')}</label>
                                        {activeTab === 'tour' ? (
                                            <Select
                                                value={formData.name}
                                                onValueChange={(value) => {
                                                    const selectedTour = tours.find(t => t.name === value)
                                                    setFormData(p => ({
                                                        ...p,
                                                        name: value,
                                                        total_price: selectedTour ? selectedTour.adult_price.toString() : p.total_price,
                                                        currency: 'EUR'
                                                    }))
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-background border-border">
                                                    <SelectValue placeholder={t('sales.selectTour' as any)} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[...tours].filter(t => t.is_active).sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                                                        <SelectItem key={t.id} value={t.name}>
                                                            {t.name} (€{t.adult_price})
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="other">{t('sales.other')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : activeTab === 'transfer' ? (
                                            <Input
                                                value={transferData.destination}
                                                onChange={e => setTransferData(p => ({ ...p, destination: e.target.value }))}
                                                className="h-8 text-xs bg-background border-border"
                                                placeholder={t('sales.transfer.destination')}
                                            />
                                        ) : activeTab === 'laundry' ? (
                                            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg border border-border/50">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{t('sales.laundry.colors')}</label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={laundryData.colors || ''}
                                                        onChange={e => setLaundryData(p => ({ ...p, colors: parseInt(e.target.value) || 0 }))}
                                                        className="h-7 text-xs bg-background border-border"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{t('sales.laundry.whites')}</label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={laundryData.whites || ''}
                                                        onChange={e => setLaundryData(p => ({ ...p, whites: parseInt(e.target.value) || 0 }))}
                                                        className="h-7 text-xs bg-background border-border"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{t('sales.laundry.ironingPieces')}</label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={laundryData.ironingPieces || ''}
                                                        onChange={e => setLaundryData(p => ({ ...p, ironingPieces: parseInt(e.target.value) || 0 }))}
                                                        className="h-7 text-xs bg-background border-border"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex flex-col gap-2 pt-1 border-t border-border/50">
                                                    <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{t('sales.service')}</label>
                                                    <div className="flex gap-1">
                                                        {(['washing', 'ironing', 'washing_ironing'] as const).map((type) => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setLaundryData(p => ({ ...p, service: type }))}
                                                                className={cn(
                                                                    "flex-1 text-[9px] py-1 px-1 rounded transition-all font-semibold border text-center",
                                                                    laundryData.service === type
                                                                        ? "bg-primary/20 text-primary border-primary/30"
                                                                        : "bg-background text-muted-foreground border-border hover:border-zinc-500"
                                                                )}
                                                            >
                                                                {t(`sales.laundry.${type === 'washing_ironing' ? 'washingAndIroning' : type}` as any)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 font-mono text-right h-3">
                                                        {(() => {
                                                            if (laundryData.service === 'ironing') return '';
                                                            const colorMachines = Math.ceil(laundryData.colors / 8);
                                                            const whiteMachines = Math.ceil(laundryData.whites / 8);
                                                            const total = colorMachines + whiteMachines;
                                                            return total > 0 ? `${total} ${total === 1 ? t('sales.laundry.machine') : t('sales.laundry.machines')}` : '';
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="h-8 text-xs bg-background border-border"
                                                placeholder={t('common.description' as any)}
                                            />
                                        )}
                                        {formData.name === 'other' && activeTab === 'tour' && (
                                            <Input
                                                placeholder={t('sales.customName')}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="h-8 text-xs mt-2 bg-background border-border"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase">{t('tours.book.guestName')}</label>
                                        <Input
                                            value={formData.customer_name}
                                            onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.room')}</label>
                                        <Input
                                            value={formData.room_number}
                                            onChange={e => setFormData(p => ({ ...p, room_number: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder="101"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.pax')}</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.pax}
                                            onChange={e => setFormData(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))}
                                            className="h-8 text-xs bg-background border-border"
                                        />
                                    </div>

                                    <div className="col-span-2 grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.date')}</label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                                className="h-8 text-xs bg-background border-border"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.pickupTime')}</label>
                                            <Input
                                                type="time"
                                                value={formData.pickup_time}
                                                onChange={e => setFormData(p => ({ ...p, pickup_time: e.target.value }))}
                                                className="h-8 text-xs bg-background border-border"
                                            />
                                        </div>
                                    </div>

                                    {activeTab === 'transfer' && (
                                        <div className="col-span-2 grid grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-muted-foreground font-bold uppercase">
                                                    {t('sales.transfer.pickup')}
                                                </label>
                                                <Input
                                                    value={transferData.pickupLocation}
                                                    onChange={e => setTransferData(p => ({ ...p, pickupLocation: e.target.value }))}
                                                    className="h-8 text-xs bg-background border-border"
                                                    placeholder="Hotel Lobby"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-muted-foreground font-bold uppercase">
                                                    {t('sales.transfer.flight')}
                                                </label>
                                                <Input
                                                    value={transferData.flightNumber}
                                                    onChange={e => setTransferData(p => ({ ...p, flightNumber: e.target.value }))}
                                                    className="h-8 text-xs bg-background border-border"
                                                    placeholder="TK1234"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-muted-foreground font-bold uppercase">
                                                    {t('sales.transfer.rest')}
                                                </label>
                                                <Input
                                                    value={transferData.restAmount}
                                                    onChange={e => setTransferData(p => ({ ...p, restAmount: e.target.value }))}
                                                    className="h-8 text-xs bg-background border-border"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1 relative">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.price')}</label>
                                        <div className="relative flex gap-1">
                                            <div className="relative flex-1">
                                                <Input
                                                    type="number"
                                                    value={formData.total_price}
                                                    onChange={e => setFormData(p => ({ ...p, total_price: e.target.value }))}
                                                    className="h-8 text-xs bg-background border-border pl-6"
                                                    placeholder="0"
                                                />
                                                <span className="absolute left-2 top-2 text-xs text-muted-foreground">
                                                    {activeTab === 'laundry' ? '₺' : (formData.currency === 'EUR' ? '€' : (formData.currency === 'TRY' ? '₺' : '$'))}
                                                </span>
                                            </div>
                                            {activeTab !== 'laundry' && (
                                                <Select
                                                    value={formData.currency}
                                                    onValueChange={(val: any) => setFormData(p => ({ ...p, currency: val }))}
                                                >
                                                    <SelectTrigger className="h-8 w-16 text-[10px] bg-background border-border">
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
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.notes')}</label>
                                        <Input
                                            value={formData.notes}
                                            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder={t('sales.optionalNotes')}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 flex items-center gap-2 py-1">
                                    <button
                                        type="button"
                                        onClick={() => setShouldAddToNotes(!shouldAddToNotes)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all border",
                                            shouldAddToNotes
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-3 h-3 rounded-sm border flex items-center justify-center transition-all",
                                            shouldAddToNotes ? "bg-emerald-500 border-emerald-500" : "bg-background border-border"
                                        )}>
                                            {shouldAddToNotes && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        {t('sales.addToNotes')}
                                    </button>
                                </div>
                                <div className="flex gap-2 pt-2 col-span-2">
                                    <Button
                                        onClick={handleAddSale}
                                        disabled={
                                            (activeTab === 'tour' && (!formData.name || formData.name === 'other')) ||
                                            (activeTab === 'transfer' && !transferData.destination) ||
                                            (activeTab === 'laundry' && (laundryData.whites === 0 && laundryData.colors === 0 && laundryData.ironingPieces === 0)) ||
                                            (activeTab === 'other' && !formData.name.trim()) ||
                                            !formData.total_price
                                        }
                                        className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs"
                                    >
                                        <Check className="w-3.5 h-3.5 mr-1" />
                                        {t('sales.create')}
                                    </Button>
                                    <Button variant="ghost" type="button" onClick={resetForm} className="h-8 text-xs">
                                        {t('common.cancel')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sales List */}
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="text-4xl mb-2 opacity-20 text-muted-foreground">{saleTypeInfo[activeTab].icon}</div>
                        <p className="text-muted-foreground text-sm">{t('sales.noSales', { label: t(saleTypeInfo[activeTab].label as any).toLowerCase() })}</p>
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
                                                <span className="font-semibold text-foreground truncate">{sale.name}</span>
                                                {remaining > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                                <span className="bg-muted px-1.5 py-0.5 rounded border border-border">Rm {sale.room_number}</span>
                                                <span>{sale.customer_name}</span>
                                                <span className="text-muted-foreground/50">•</span>
                                                <span>{formatDisplayDate(sale.date)}</span>
                                                <span className="text-muted-foreground/50">•</span>
                                                <span className="text-primary">{t('sales.soldBy', { name: sale.created_by_name })}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-bold text-foreground">
                                                {sale.currency === 'EUR' ? '€' : (sale.currency === 'TRY' ? '₺' : '$')}
                                                {sale.total_price}
                                            </div>
                                            <div className={cn("text-[10px] font-medium", paymentStatusInfo[sale.payment_status].color.replace('bg-', 'text-').split(' ')[1])}>
                                                {t(paymentStatusInfo[sale.payment_status].label as any)}
                                            </div>
                                            {/* Detailed Status Select */}
                                            <div onClick={(e) => e.stopPropagation()} className="mt-2">
                                                <Select
                                                    value={sale.status || 'waiting'}
                                                    onValueChange={(val: any) => {
                                                        if (hotel?.id) {
                                                            updateSale(hotel.id, sale.id, { status: val })
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-6 text-[10px] uppercase font-bold tracking-wider px-2 py-0 border-0 min-w-[90px] justify-between gap-1 transition-colors rounded-md shadow-sm",
                                                        saleStatusInfo[sale.status as SaleStatus || 'waiting']?.color || "bg-muted text-muted-foreground"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent align="end" className="bg-popover border-border">
                                                        {(Object.keys(saleStatusInfo) as SaleStatus[]).map((status) => (
                                                            <SelectItem key={status} value={status} className="text-xs focus:bg-muted focus:text-foreground">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn("w-2 h-2 rounded-full", saleStatusInfo[status].color.split(' ')[0].replace('/20', ''))} />
                                                                    {t(saleStatusInfo[status].label as any)}
                                                                </div>
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
        </Card >
    )
}
