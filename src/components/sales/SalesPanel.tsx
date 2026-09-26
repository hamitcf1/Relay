import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, MapPin, Truck, ShoppingBag, CreditCard, Loader2, X, Check, Receipt, Ticket, Trash2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatDisplayDate } from '@/lib/utils'
import { useSalesStore, saleTypeInfo, paymentStatusInfo, saleStatusInfo } from '@/stores/salesStore'
import { useTourStore } from '@/stores/tourStore'
import { SalesDetailModal } from './SalesDetailModal'
import { VoucherPreviewModal } from './VoucherPreviewModal'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
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
import { useNotesStore, priorityInfo } from '@/stores/notesStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SaleType, Currency, SaleStatus, NotePriority } from '@/types'
import { toast } from 'sonner'
import { useWorkspaceDirty } from '@/hooks/useWorkspaceDirty'
import { useSearchParams } from 'react-router-dom'

export function SalesPanel() {
    const { t } = useLanguageStore()
    const [searchParams, setSearchParams] = useSearchParams()
    const { sales, loading, subscribeToSales, addSale, updateSale, bulkUpdateSales, bulkDeleteSales, emptySalesTrash } = useSalesStore()
    const { tours, subscribeToTours } = useTourStore()
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()
    const { rates, fetchRates } = useCurrencyStore()
    const confirm = useConfirm()

    const [activeTab, setActiveTab] = useState<SaleType>('tour')
    const [isAdding, setIsAdding] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null)
    const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([])
    const [filterPriority, setFilterPriority] = useState<NotePriority | 'all'>('all')
    const [filterLifecycle, setFilterLifecycle] = useState<'active' | 'archived' | 'trash'>('active')

    const saleParam = searchParams.get('sale')

    useEffect(() => {
        if (saleParam) setSelectedSaleId(saleParam)
    }, [saleParam])

    const closeDetail = () => {
        setSelectedSaleId(null)
        if (!saleParam) return
        const next = new URLSearchParams(searchParams)
        next.delete('sale')
        setSearchParams(next, { replace: true })
    }

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        customer_name: '',
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

    const [hotelInfo, setHotelInfo] = useState<any>(null)
    const [shouldAddToNotes, setShouldAddToNotes] = useState(true)
    const [paidOnSale, setPaidOnSale] = useState(false)
    const [saving, setSaving] = useState(false)
    useWorkspaceDirty('sale', isAdding)
    const { addNote } = useNotesStore()

    useEffect(() => {
        if (!hotel?.id) return
        const unsubSales = subscribeToSales(hotel.id)
        const unsubTours = subscribeToTours(hotel.id)

        // Fetch prices
        if (!user?.is_demo) {
            getDoc(doc(db, 'hotels', hotel.id, 'settings', 'info')).then(snap => {
                if (snap.exists()) setHotelInfo(snap.data())
            })
        }

        fetchRates()

        return () => {
            unsubSales()
            unsubTours()
        }
    }, [hotel?.id, subscribeToSales, subscribeToTours, fetchRates, user?.is_demo])

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

    const filteredSales = sales.filter(s => {
        if (s.type !== activeTab) return false
        const saleLifecycle = s.lifecycle_status || 'active'
        if (saleLifecycle !== filterLifecycle) return false
        if (filterPriority !== 'all' && (s.priority || 'medium') !== filterPriority) return false
        return true
    })

    const resetForm = () => {
        setFormData({
            name: '',
            customer_name: '',
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
        setIsAdding(false)
    }

    const handleToggleSelectAll = () => {
        if (selectedSaleIds.length === filteredSales.length) {
            setSelectedSaleIds([])
        } else {
            setSelectedSaleIds(filteredSales.map(s => s.id))
        }
    }

    const handleToggleSelectSale = (id: string) => {
        setSelectedSaleIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleBulkStatusChange = async (status: SaleStatus) => {
        if (!hotel?.id || selectedSaleIds.length === 0) return
        await bulkUpdateSales(hotel.id, selectedSaleIds, { status })
        setSelectedSaleIds([])
    }

    const handleBulkPriorityChange = async (priority: NotePriority) => {
        if (!hotel?.id || selectedSaleIds.length === 0) return
        await bulkUpdateSales(hotel.id, selectedSaleIds, { priority })
        setSelectedSaleIds([])
    }

    const handleBulkLifecycleChange = async (lifecycle_status: 'active' | 'archived' | 'trash') => {
        if (!hotel?.id || selectedSaleIds.length === 0) return
        const updates: any = { lifecycle_status }
        if (lifecycle_status === 'trash') updates.trashed_at = new Date()
        if (lifecycle_status === 'active') updates.trashed_at = null
        await bulkUpdateSales(hotel.id, selectedSaleIds, updates)
        setSelectedSaleIds([])
    }

    const handleBulkDelete = async () => {
        if (!hotel?.id || selectedSaleIds.length === 0) return
        const confirmed = await confirm({
            title: 'Seçili Satışları Kalıcı Olarak Sil',
            description: `${selectedSaleIds.length} satışı veritabanından kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            variant: 'destructive',
            confirmLabel: 'Evet, Sil'
        })
        if (confirmed) {
            await bulkDeleteSales(hotel.id, selectedSaleIds)
            setSelectedSaleIds([])
        }
    }

    const handleEmptyTrash = async () => {
        if (!hotel?.id) return
        const confirmed = await confirm({
            title: 'Çöp Kutusu Temizlensin mi?',
            description: 'Çöp kutusundaki TÜM satışlar kalıcı olarak silinecek (30 günü beklemeden). Emin misiniz?',
            variant: 'destructive',
            confirmLabel: 'Çöp Kutusunu Boşalt'
        })
        if (confirmed) {
            await emptySalesTrash(hotel.id)
            setSelectedSaleIds([])
        }
    }

    const handleAddSale = async () => {
        const isLaundry = activeTab === 'laundry'
        const isTransfer = activeTab === 'transfer'

        const finalName = isLaundry ? t('sales.type.laundry') : (isTransfer ? transferData.destination : formData.name.trim())
        if (!hotel?.id || !user || !finalName || !formData.total_price || !formData.date || !formData.sale_date || !formData.pickup_time) {
            toast.error('Satış tarihi, hizmet tarihi ve teslim alma saati zorunludur.')
            return
        }
        if (saving) return
        setSaving(true)

        try {
        const saleDate = new Date(`${formData.date}T12:00:00`)
        const recordedSaleDate = new Date(`${formData.sale_date}T12:00:00`)
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

        const saleId = await addSale(hotel.id, {
            type: activeTab,
            name: finalName,
            customer_name: formData.customer_name.trim(),
            room_number: formData.room_number.trim(),
            pax: formData.pax,
            date: saleDate,
            sale_date: recordedSaleDate,
            pickup_time: formData.pickup_time,
            total_price: totalPrice,
            currency: isLaundry ? 'TRY' : formData.currency,
            notes: finalNotes,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown',
            status: formData.status,
            priority: formData.priority,
            lifecycle_status: 'active'
        })

        // Record the initial payment before creating the linked shift note.
        if (paidOnSale) await useSalesStore.getState().collectPayment(hotel.id, saleId, totalPrice, isLaundry ? 'TRY' : formData.currency)

        if (shouldAddToNotes) {
            const noteContent = [
                t(saleTypeInfo[activeTab].label as any), finalName,
                formData.customer_name.trim() && `Misafir: ${formData.customer_name.trim()}`,
                formData.room_number.trim() && `Oda: ${formData.room_number.trim()}`,
                `Satış: ${formData.sale_date}`, `Hizmet: ${formData.date}`,
                `Alış saati: ${formData.pickup_time}`,
                `${totalPrice} ${isLaundry ? 'TRY' : formData.currency}`, finalNotes
            ].filter(Boolean).join(' · ')
            await addNote(hotel.id, {
                category: 'payment_needed',
                content: noteContent,
                room_number: formData.room_number.trim(),
                is_relevant: true,
                created_by: user.uid,
                created_by_name: user.name || 'Staff',
                guest_name: formData.customer_name.trim(),
                shift_id: null,
                amount_due: totalPrice,
                is_paid: paidOnSale,
                currency: isLaundry ? 'TRY' : formData.currency,
                sale_id: saleId,
                priority: formData.priority
            })
        }

        resetForm()
        } catch (error) {
            console.error('Sale creation failed:', error)
            toast.error('Satış kaydedilemedi. Lütfen tekrar deneyin.')
        } finally {
            setSaving(false)
        }
    }

    const tabs: { type: SaleType; icon: React.ReactNode }[] = [
        { type: 'tour', icon: <MapPin className="w-4 h-4" /> },
        { type: 'transfer', icon: <Truck className="w-4 h-4" /> },
        { type: 'laundry', icon: <ShoppingBag className="w-4 h-4" /> }
    ]

    return (
        <Card className="bg-card/50 border-border min-h-full w-full flex flex-col">
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
                            onClick={() => { setActiveTab(type); setSelectedSaleIds([]); }}
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

                {/* Filter Bar: Lifecycle & Priority */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1">
                        {(['active', 'archived', 'trash'] as const).map(l => (
                            <button
                                key={l}
                                onClick={() => { setFilterLifecycle(l); setSelectedSaleIds([]); }}
                                className={cn(
                                    "text-xs px-2.5 py-1 rounded-md transition-all font-medium border",
                                    filterLifecycle === l
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                                )}
                            >
                                {l === 'active' ? 'Aktif Satışlar' : (l === 'archived' ? 'Arşiv' : 'Çöp Kutusu')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={filterPriority} onValueChange={(val: any) => setFilterPriority(val)}>
                            <SelectTrigger className="h-7 text-xs bg-background border-border w-[130px]">
                                <SelectValue placeholder="Aciliyet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">Tüm Aciliyetler</SelectItem>
                                {(Object.keys(priorityInfo) as NotePriority[]).map(p => (
                                    <SelectItem key={p} value={p} className="text-xs">
                                        {priorityInfo[p].symbol} {t(`priority.${p}` as any) as string}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {filterLifecycle === 'trash' && user?.role === 'gm' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleEmptyTrash}
                                className="h-7 text-xs gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                                Çöp Kutusunu Boşalt
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 p-3">
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
                                                        total_price: selectedTour ? (selectedTour.adult_price * p.pax).toString() : p.total_price,
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
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Oda numarası (varsa)</label>
                                        <Input
                                            value={formData.room_number}
                                            onChange={e => setFormData(p => ({ ...p, room_number: e.target.value }))}
                                            className="h-8 text-xs bg-background border-border"
                                            placeholder="Örn. 101 · otel dışıysa boş bırakın"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.pax')}</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.pax}
                                            onChange={e => {
                                                const newPax = parseInt(e.target.value) || 1;
                                                setFormData(p => {
                                                    let newPrice = p.total_price;
                                                    if (activeTab === 'tour' && p.name && p.name !== 'other') {
                                                        const selectedTour = tours.find(t => t.name === p.name);
                                                        if (selectedTour) {
                                                            newPrice = (selectedTour.adult_price * newPax).toString();
                                                        }
                                                    }
                                                    return { ...p, pax: newPax, total_price: newPrice };
                                                });
                                            }}
                                            className="h-8 text-xs bg-background border-border"
                                        />
                                    </div>

                                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold">Satış tarihi *</label>
                                            <Input type="date" required value={formData.sale_date} onChange={e => setFormData(p => ({ ...p, sale_date: e.target.value }))} className="h-9 bg-background" />
                                            <p className="text-[10px] text-muted-foreground">İşlemin yapıldığı gün</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold">Hizmet / gerçekleşme tarihi *</label>
                                            <Input
                                                type="date" required
                                                value={formData.date}
                                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                                className="h-8 text-xs bg-background border-border"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold">Teslim alma / pick-up saati *</label>
                                            <Input
                                                type="time" required
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
                                        {formData.total_price && formData.currency !== 'TRY' && rates?.[formData.currency as keyof typeof rates] && (
                                            <div className="text-[10px] text-muted-foreground mt-1 text-right">
                                                ≈ {(parseFloat(formData.total_price) * rates[formData.currency as keyof typeof rates]!.selling).toFixed(2)} ₺
                                            </div>
                                        )}
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

                                <div className="col-span-2 grid grid-cols-3 gap-2 py-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('status.label' as any)}</label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val: any) => setFormData(p => ({ ...p, status: val }))}
                                        >
                                            <SelectTrigger className={cn(
                                                "h-8 text-xs bg-background border-border",
                                                saleStatusInfo[formData.status]?.color
                                            )}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {(Object.keys(saleStatusInfo) as SaleStatus[]).map((status) => (
                                                    <SelectItem key={status} value={status} className="text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("w-2 h-2 rounded-full", saleStatusInfo[status].color.split(' ')[0].replace('/20', ''))} />
                                                            {t(saleStatusInfo[status].label as any)}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('priority.label' as any)}</label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(val: any) => setFormData(p => ({ ...p, priority: val }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {(Object.keys(priorityInfo) as NotePriority[]).map((p) => (
                                                    <SelectItem key={p} value={p} className="text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span>{priorityInfo[p].symbol}</span>
                                                            <span>{t(`priority.${p}` as any) as string}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => setShouldAddToNotes(!shouldAddToNotes)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all border w-full h-8",
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
                                </div>
                                <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-xs">
                                    <input type="checkbox" checked={paidOnSale} onChange={e => setPaidOnSale(e.target.checked)} />
                                    Ödemenin tamamı satış sırasında alındı
                                </label>
                                <div className="flex gap-2 pt-2 col-span-2">
                                    <Button
                                        onClick={handleAddSale}
                                        disabled={
                                            (activeTab === 'tour' && (!formData.name || formData.name === 'other')) ||
                                            (activeTab === 'transfer' && !transferData.destination) ||
                                            (activeTab === 'laundry' && (laundryData.whites === 0 && laundryData.colors === 0 && laundryData.ironingPieces === 0)) ||
                                            (activeTab === 'other' && !formData.name.trim()) ||
                                            !formData.total_price || !formData.date || !formData.sale_date || !formData.pickup_time || saving
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
                    <EmptyState
                        icon={Receipt}
                        title={t('sales.noSales', { label: t(saleTypeInfo[activeTab].label as any).toLowerCase() })}
                    />
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
                                        sale.status === 'cancelled' || sale.payment_status === 'cancelled' || sale.payment_status === 'refunded'
                                            ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30'
                                            : sale.payment_status === 'paid'
                                                ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
                                                : sale.payment_status === 'partial'
                                                    ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30'
                                                    : 'bg-card border-border hover:border-primary/50 hover:bg-accent/40'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center pt-1" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedSaleIds.includes(sale.id)}
                                                onChange={() => handleToggleSelectSale(sale.id)}
                                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-lg group-hover:scale-110 transition-transform">{saleTypeInfo[sale.type].icon}</span>
                                                <span className="font-semibold text-foreground truncate">{sale.name}</span>
                                                {sale.priority && sale.priority !== 'low' && (
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                                                        sale.priority === 'critical' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                        sale.priority === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}>
                                                        {priorityInfo[sale.priority]?.symbol} {t(`priority.${sale.priority}` as any) as string}
                                                    </span>
                                                )}
                                                {sale.status !== 'cancelled' && remaining > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-6 h-6 ml-auto hover:bg-primary/20 hover:text-primary" 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedVoucherId(sale.id); }}
                                                    title="Digital Voucher"
                                                >
                                                    <Ticket className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                                {sale.room_number && <span className="bg-muted px-1.5 py-0.5 rounded border border-border">Oda {sale.room_number}</span>}
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
                                                {sale.currency !== 'TRY' && rates?.[sale.currency as keyof typeof rates] && (
                                                    <span className="text-[10px] text-muted-foreground ml-1 font-normal whitespace-nowrap">
                                                        (₺{(sale.total_price * rates[sale.currency as keyof typeof rates]!.selling).toFixed(2)})
                                                    </span>
                                                )}
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

                {/* Floating Bulk Actions Bar */}
                {selectedSaleIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="sticky bottom-4 z-40 p-2.5 bg-card/95 backdrop-blur border border-primary/30 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{selectedSaleIds.length} satış seçildi</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleSelectAll}
                                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            >
                                {selectedSaleIds.length === filteredSales.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select onValueChange={(val: any) => handleBulkStatusChange(val)}>
                                <SelectTrigger className="h-7 text-xs bg-background border-border w-[120px]">
                                    <SelectValue placeholder="Durum Değiştir" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(saleStatusInfo) as SaleStatus[]).map(status => (
                                        <SelectItem key={status} value={status} className="text-xs">
                                            {t(saleStatusInfo[status].label as any)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select onValueChange={(val: any) => handleBulkPriorityChange(val)}>
                                <SelectTrigger className="h-7 text-xs bg-background border-border w-[120px]">
                                    <SelectValue placeholder="Aciliyet Belirle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(priorityInfo) as NotePriority[]).map(p => (
                                        <SelectItem key={p} value={p} className="text-xs">
                                            {priorityInfo[p].symbol} {t(`priority.${p}` as any) as string}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {filterLifecycle === 'active' && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => handleBulkLifecycleChange('archived')} className="h-7 text-xs gap-1">
                                        <Archive className="w-3 h-3" /> Arşive Al
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleBulkLifecycleChange('trash')} className="h-7 text-xs gap-1 text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
                                        <Trash2 className="w-3 h-3" /> Çöpe At
                                    </Button>
                                </>
                            )}

                            {filterLifecycle === 'archived' && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => handleBulkLifecycleChange('active')} className="h-7 text-xs gap-1">
                                        Aktife Taşı
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleBulkLifecycleChange('trash')} className="h-7 text-xs gap-1 text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
                                        <Trash2 className="w-3 h-3" /> Çöpe At
                                    </Button>
                                </>
                            )}

                            {filterLifecycle === 'trash' && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => handleBulkLifecycleChange('active')} className="h-7 text-xs gap-1">
                                        Geri Yükle
                                    </Button>
                                    {user?.role === 'gm' && (
                                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-7 text-xs gap-1">
                                            <Trash2 className="w-3 h-3" /> Kalıcı Sil
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
                <ScrollToTopButton />
            </CardContent>

            <SalesDetailModal
                saleId={selectedSaleId}
                onClose={closeDetail}
            />
            
            <VoucherPreviewModal
                saleId={selectedVoucherId}
                onClose={() => setSelectedVoucherId(null)}
            />
        </Card >
    )
}
