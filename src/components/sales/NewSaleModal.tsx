import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { X, MapPin, Truck, ShoppingBag, CreditCard, User, Clock, Check, Loader2, DollarSign, Tag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn, parseGuestNames } from '@/lib/utils'
import { saleTypeInfo } from '@/stores/salesStore'
import { priorityInfo } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { playChimeSound } from '@/lib/soundEffects'
import type { SaleType, Currency, SaleStatus, NotePriority, Tour } from '@/types'
import { toast } from 'sonner'
import { useWorkspaceDirty } from '@/hooks/useWorkspaceDirty'

interface NewSaleModalProps {
    isOpen: boolean
    onClose: () => void
    tours: Tour[]
    hotelInfo: any
    activeTab: SaleType
    setActiveTab: (type: SaleType) => void
    onAddSaleSubmit: (data: {
        type: SaleType
        finalName: string
        customer_name: string
        customer_phone: string
        room_number: string
        pax: number
        date: string
        sale_date: string
        pickup_time: string
        total_price: number
        currency: Currency
        finalNotes: string
        status: SaleStatus
        priority: NotePriority
        paidOnSale: boolean
        shouldAddToNotes: boolean
        transferData?: {
            pickupLocation?: string
            destination?: string
            flightNumber?: string
        }
    }) => Promise<void>
}

export function NewSaleModal({
    isOpen,
    onClose,
    tours,
    hotelInfo,
    activeTab,
    setActiveTab,
    onAddSaleSubmit
}: NewSaleModalProps) {
    const { t } = useLanguageStore()
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        customer_name: '',
        customer_phone: '',
        room_number: '',
        pax: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        sale_date: format(new Date(), 'yyyy-MM-dd'),
        pickup_time: '',
        total_price: '',
        currency: 'EUR' as Currency,
        notes: '',
        status: 'waiting' as SaleStatus,
        priority: 'medium' as NotePriority
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

    const [shouldAddToNotes, setShouldAddToNotes] = useState(true)
    const [paidOnSale, setPaidOnSale] = useState(false)

    useWorkspaceDirty('sale', isOpen)

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    // Auto-calculate Laundry Price
    useEffect(() => {
        if (activeTab === 'laundry' && hotelInfo) {
            const colorMachines = Math.ceil(laundryData.colors / 8)
            const whiteMachines = Math.ceil(laundryData.whites / 8)
            const totalMachines = colorMachines + whiteMachines

            const laundryBase = (laundryData.service !== 'ironing') ? totalMachines * (hotelInfo.laundry_price || 0) : 0
            const ironingTotal = (laundryData.service !== 'washing') ? laundryData.ironingPieces * (hotelInfo.ironing_price || 0) : 0

            const total = laundryBase + ironingTotal
            if (total > 0) {
                setFormData(p => ({ ...p, total_price: total.toString() }))
            }
        }
    }, [laundryData.colors, laundryData.whites, laundryData.ironingPieces, laundryData.service, activeTab, hotelInfo])

    const resetForm = () => {
        setFormData({
            name: '',
            customer_name: '',
            customer_phone: '',
            room_number: '',
            pax: 1,
            date: format(new Date(), 'yyyy-MM-dd'),
            sale_date: format(new Date(), 'yyyy-MM-dd'),
            pickup_time: '',
            total_price: '',
            currency: 'EUR',
            notes: '',
            status: 'waiting',
            priority: 'medium'
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
        setPaidOnSale(false)
        setShouldAddToNotes(true)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const isLaundry = activeTab === 'laundry'
        const isTransfer = activeTab === 'transfer'

        const finalName = isLaundry ? t('sales.type.laundry') : (isTransfer ? transferData.destination : formData.name.trim())
        if (!finalName || !formData.total_price || !formData.date || !formData.sale_date || !formData.pickup_time) {
            toast.error('Satış tarihi, hizmet tarihi ve teslim alma saati zorunludur.')
            return
        }
        if (saving) return
        setSaving(true)

        try {
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

            await onAddSaleSubmit({
                type: activeTab,
                finalName,
                customer_name: formData.customer_name.trim(),
                customer_phone: formData.customer_phone.trim(),
                room_number: formData.room_number.trim(),
                pax: formData.pax,
                date: formData.date,
                sale_date: formData.sale_date,
                pickup_time: formData.pickup_time,
                total_price: totalPrice,
                currency: isLaundry ? 'TRY' : formData.currency,
                finalNotes,
                status: formData.status,
                priority: formData.priority,
                paidOnSale,
                shouldAddToNotes,
                ...(isTransfer ? {
                    transferData: {
                        pickupLocation: transferData.pickupLocation.trim(),
                        destination: transferData.destination.trim(),
                        flightNumber: transferData.flightNumber.trim()
                    }
                } : {})
            })

            playChimeSound()
            handleClose()
        } catch (error) {
            console.error('Sale creation error:', error)
            toast.error('Satış eklenirken bir hata oluştu.')
        } finally {
            setSaving(false)
        }
    }

    const tabs: { type: SaleType; icon: React.ReactNode }[] = [
        { type: 'tour', icon: <MapPin className="w-4 h-4" /> },
        { type: 'transfer', icon: <Truck className="w-4 h-4" /> },
        { type: 'laundry', icon: <ShoppingBag className="w-4 h-4" /> }
    ]

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
                    {/* Backdrop click */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative z-10 my-auto w-full max-w-2xl bg-card border border-primary/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.25)]">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground tracking-tight">
                                        Yeni Satış İşlemi
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {t('sales.newType', { label: t(saleTypeInfo[activeTab].label as any) })}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClose}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Service Type Tabs */}
                        <div className="px-5 pt-3">
                            <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
                                {tabs.map(({ type, icon }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setActiveTab(type)}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all',
                                            activeTab === type
                                                ? 'bg-background text-primary shadow-sm border border-primary/20'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                                        )}
                                    >
                                        {icon}
                                        {t(saleTypeInfo[type].label as any)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
                            {/* Service Details Section */}
                            <div className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-primary" />
                                    {t('sales.service')}
                                </label>

                                {activeTab === 'tour' ? (
                                    <Select
                                        value={formData.name}
                                        onValueChange={(value) => {
                                            const selectedTour = tours.find(t => t.name === value)
                                            setFormData(p => ({
                                                ...p,
                                                name: value,
                                                total_price: selectedTour ? (selectedTour.adult_price * p.pax).toString() : p.total_price,
                                                currency: 'EUR'
                                            }))
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs bg-background border-border">
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
                                        className="h-9 text-xs bg-background border-border"
                                        placeholder={t('sales.transfer.destination')}
                                    />
                                ) : activeTab === 'laundry' ? (
                                    <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-background/50 rounded-lg border border-border/50">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.laundry.colors')}</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={laundryData.colors || ''}
                                                onChange={e => setLaundryData(p => ({ ...p, colors: parseInt(e.target.value) || 0 }))}
                                                className="h-8 text-xs bg-background border-border"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.laundry.whites')}</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={laundryData.whites || ''}
                                                onChange={e => setLaundryData(p => ({ ...p, whites: parseInt(e.target.value) || 0 }))}
                                                className="h-8 text-xs bg-background border-border"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.laundry.ironingPieces')}</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={laundryData.ironingPieces || ''}
                                                onChange={e => setLaundryData(p => ({ ...p, ironingPieces: parseInt(e.target.value) || 0 }))}
                                                className="h-8 text-xs bg-background border-border"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="col-span-2 flex flex-col gap-1.5 pt-1.5 border-t border-border/50">
                                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.service')}</label>
                                            <div className="flex gap-1.5">
                                                {(['washing', 'ironing', 'washing_ironing'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setLaundryData(p => ({ ...p, service: type }))}
                                                        className={cn(
                                                            "flex-1 text-[10px] py-1.5 px-2 rounded-md transition-all font-semibold border text-center",
                                                            laundryData.service === type
                                                                ? "bg-primary/20 text-primary border-primary/40 shadow-xs"
                                                                : "bg-background text-muted-foreground border-border hover:border-zinc-500"
                                                        )}
                                                    >
                                                        {t(`sales.laundry.${type === 'washing_ironing' ? 'washingAndIroning' : type}` as any)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="h-9 text-xs bg-background border-border"
                                        placeholder={t('common.description' as any)}
                                    />
                                )}

                                {formData.name === 'other' && activeTab === 'tour' && (
                                    <Input
                                        placeholder={t('sales.customName')}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="h-9 text-xs mt-2 bg-background border-border"
                                    />
                                )}
                            </div>

                            {/* Guest & Transfer Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.guestName')}</label>
                                        <span className="text-[9px] text-muted-foreground/80">Virgül ile birden fazla</span>
                                    </div>
                                    <Input
                                        value={formData.customer_name}
                                        onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                                        className="h-8 text-xs bg-background border-border"
                                        placeholder="Örn: Ahmet Yılmaz, Ayşe Yılmaz"
                                    />
                                    {parseGuestNames(formData.customer_name).length > 1 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {parseGuestNames(formData.customer_name).map((name, idx) => (
                                                <span key={idx} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" /> {name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Misafir Tel No</label>
                                    <Input
                                        value={formData.customer_phone}
                                        onChange={e => setFormData(p => ({ ...p, customer_phone: e.target.value }))}
                                        className="h-8 text-xs bg-background border-border"
                                        placeholder="+90 532 ..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Oda Numarası (varsa)</label>
                                    <Input
                                        value={formData.room_number}
                                        onChange={e => setFormData(p => ({ ...p, room_number: e.target.value }))}
                                        className="h-8 text-xs bg-background border-border"
                                        placeholder="Örn. 101"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.pax')}</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.pax}
                                        onChange={e => {
                                            const newPax = parseInt(e.target.value) || 1
                                            setFormData(p => {
                                                let newPrice = p.total_price
                                                if (activeTab === 'tour' && p.name && p.name !== 'other') {
                                                    const selectedTour = tours.find(t => t.name === p.name)
                                                    if (selectedTour) {
                                                        newPrice = (selectedTour.adult_price * newPax).toString()
                                                    }
                                                }
                                                return { ...p, pax: newPax, total_price: newPrice }
                                            })
                                        }}
                                        className="h-8 text-xs bg-background border-border"
                                    />
                                </div>
                            </div>

                            {activeTab === 'transfer' && (
                                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.transfer.pickup')}</label>
                                        <Input
                                            value={transferData.pickupLocation}
                                            onChange={e => setTransferData(p => ({ ...p, pickupLocation: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder="Lobi / Adres"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.transfer.flight')}</label>
                                        <Input
                                            value={transferData.flightNumber}
                                            onChange={e => setTransferData(p => ({ ...p, flightNumber: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder="TK1234"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('sales.transfer.rest')}</label>
                                        <Input
                                            value={transferData.restAmount}
                                            onChange={e => setTransferData(p => ({ ...p, restAmount: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder="Kalan tutar"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Dates Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-primary/20 bg-primary/5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-primary" /> Satış Tarihi *
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.sale_date}
                                        onChange={e => setFormData(p => ({ ...p, sale_date: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-primary" /> Hizmet Tarihi *
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-primary" /> Alış / Pick-up Saati *
                                    </label>
                                    <Input
                                        type="time"
                                        required
                                        value={formData.pickup_time}
                                        onChange={e => setFormData(p => ({ ...p, pickup_time: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </div>

                            {/* Pricing & Controls Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                                        <DollarSign className="w-3 h-3 text-emerald-400" /> {t('sales.price')} *
                                    </label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.total_price}
                                            onChange={e => setFormData(p => ({ ...p, total_price: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border flex-1 font-mono font-bold"
                                            placeholder="0.00"
                                        />
                                        {activeTab !== 'laundry' ? (
                                            <Select value={formData.currency} onValueChange={(val: Currency) => setFormData(p => ({ ...p, currency: val }))}>
                                                <SelectTrigger className="h-8 text-xs bg-background border-border w-[70px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EUR">EUR</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="TRY">TRY</SelectItem>
                                                    <SelectItem value="GBP">GBP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="h-8 px-2.5 rounded-md bg-muted flex items-center text-xs font-bold text-muted-foreground">TRY</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Aciliyet Önceliği</label>
                                    <Select value={formData.priority} onValueChange={(val: NotePriority) => setFormData(p => ({ ...p, priority: val }))}>
                                        <SelectTrigger className="h-8 text-xs bg-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(priorityInfo) as NotePriority[]).map(p => (
                                                <SelectItem key={p} value={p} className="text-xs">
                                                    {priorityInfo[p].symbol} {t(`priority.${p}` as any) as string}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Satış Durumu</label>
                                    <Select value={formData.status} onValueChange={(val: SaleStatus) => setFormData(p => ({ ...p, status: val }))}>
                                        <SelectTrigger className="h-8 text-xs bg-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="waiting" className="text-xs">Bekliyor (Yapılacak)</SelectItem>
                                            <SelectItem value="confirmed" className="text-xs">Onaylandı</SelectItem>
                                            <SelectItem value="completed" className="text-xs">Tamamlandı</SelectItem>
                                            <SelectItem value="cancelled" className="text-xs">İptal Edildi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Extra Checks */}
                            <div className="flex flex-wrap gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                                    <input
                                        type="checkbox"
                                        checked={paidOnSale}
                                        onChange={e => setPaidOnSale(e.target.checked)}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="font-semibold text-foreground">Ödeme hemen tahsil edildi mi?</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                                    <input
                                        type="checkbox"
                                        checked={shouldAddToNotes}
                                        onChange={e => setShouldAddToNotes(e.target.checked)}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="text-muted-foreground">Vardiya devir notlarına otomatik aktar</span>
                                </label>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-muted-foreground font-bold uppercase">Ek Notlar / Özel İstekler</label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                    className="text-xs bg-background border-border min-h-[60px]"
                                    placeholder="Opsiyonel detaylar, rehber notları vb..."
                                />
                            </div>

                            {/* Actions Footer */}
                            <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    className="h-9 px-4 text-xs"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 px-5 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                >
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    Satışı Kaydet
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
