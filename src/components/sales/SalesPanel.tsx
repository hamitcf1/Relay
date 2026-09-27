import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, MapPin, Truck, ShoppingBag, CreditCard, Loader2, X, Receipt, Ticket, Trash2, Archive, Search, Download, FileText } from 'lucide-react'
import { exportToCsv } from '@/lib/exportCsv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatDisplayDate, parseGuestNames, isTRYCurrency } from '@/lib/utils'
import { useSalesStore, saleTypeInfo, paymentStatusInfo, saleStatusInfo } from '@/stores/salesStore'
import { useTourStore } from '@/stores/tourStore'
import { SalesDetailModal } from './SalesDetailModal'
import { VoucherPreviewModal } from './VoucherPreviewModal'
import { NewSaleModal } from './NewSaleModal'
import { TourConfirmationPdfModal } from './TourConfirmationPdfModal'
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
import { useSearchParams } from 'react-router-dom'
import { useWorkspaceDirty } from '@/hooks/useWorkspaceDirty'
import { TourCatalogue } from '@/components/tours/TourCatalogue'

interface SalesPanelProps {
    initialTab?: 'sales' | 'tours'
}

export function SalesPanel({ initialTab = 'sales' }: SalesPanelProps = {}) {
    const { language, t } = useLanguageStore()
    const [mainTab, setMainTab] = useState<'sales' | 'tours'>(initialTab)
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
    const [selectedConfirmationSale, setSelectedConfirmationSale] = useState<any | null>(null)
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

    const [hotelInfo, setHotelInfo] = useState<any>(null)
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

    if (mainTab === 'tours') {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <button
                        onClick={() => setMainTab('sales')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                        <CreditCard className="w-4 h-4" />
                        <span>{language === 'tr' ? 'Satış Kayıtları' : 'Sales Records'}</span>
                    </button>
                    <button
                        onClick={() => setMainTab('tours')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-md transition-colors"
                    >
                        <MapPin className="w-4 h-4" />
                        <span>{language === 'tr' ? 'Tur Kataloğu & Ürünler' : 'Tour Catalogue'}</span>
                    </button>
                </div>
                <TourCatalogue />
            </div>
        )
    }

    const [searchQuery, setSearchQuery] = useState('')

    const filteredSales = sales.filter(s => {
        if (s.type !== activeTab) return false
        const saleLifecycle = s.lifecycle_status || 'active'
        if (saleLifecycle !== filterLifecycle) return false
        if (filterPriority !== 'all' && (s.priority || 'medium') !== filterPriority) return false

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            const resCode = (s.reservation_code || ('RES-' + s.id.slice(0, 6))).toLowerCase()
            const nameMatch = s.name?.toLowerCase().includes(q)
            const customerMatch = s.customer_name?.toLowerCase().includes(q)
            const phoneMatch = s.customer_phone?.toLowerCase().includes(q)
            const roomMatch = s.room_number?.toLowerCase().includes(q)
            const flightMatch = s.flight_number?.toLowerCase().includes(q)
            const codeMatch = resCode.includes(q)
            return codeMatch || nameMatch || customerMatch || phoneMatch || roomMatch || flightMatch
        }

        return true
    })



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
        if (!hotel?.id || user?.role !== 'gm' || selectedSaleIds.length === 0) return
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
        if (!hotel?.id || user?.role !== 'gm') return
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

    const handleExportCsv = () => {
        if (filteredSales.length === 0) {
            toast.info('Dışa aktarılacak satış kaydı bulunmuyor.')
            return
        }
        const rows = filteredSales.map(s => ({
            'Rezervasyon No': s.reservation_code || `RES-${s.id.slice(0, 6).toUpperCase()}`,
            'Satış Tipi': t(saleTypeInfo[s.type].label as any),
            'Satış Kalemi': s.name,
            'Misafir Adı': s.customer_name || '',
            'Telefon': s.customer_phone || '',
            'Oda No': s.room_number || '',
            'Hizmet Tarihi': s.date || '',
            'Alınış Saati': s.pickup_time || '',
            'Toplam Tutar': s.total_price,
            'Döviz': s.currency,
            'Tahsil Edilen': s.collected_amount,
            'Ödeme Durumu': t(paymentStatusInfo[s.payment_status].label as any),
            'Satışı Yapan': s.created_by_name || ''
        }))
        exportToCsv(`Satış_Raporu_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows)
        toast.success(`${rows.length} satış kaydı Excel/CSV olarak indirildi!`)
    }

    const handleAddSaleSubmit = async (data: {
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
    }) => {
        if (!hotel?.id || !user) return

        const saleDate = new Date(`${data.date}T12:00:00`)
        const recordedSaleDate = new Date(`${data.sale_date}T12:00:00`)

        const saleId = await addSale(hotel.id, {
            type: data.type,
            name: data.finalName,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            room_number: data.room_number,
            pax: data.pax,
            date: saleDate,
            sale_date: recordedSaleDate,
            pickup_time: data.pickup_time,
            ...(data.transferData ? {
                pickup_location: data.transferData.pickupLocation || undefined,
                dropoff_location: data.transferData.destination || undefined,
                flight_number: data.transferData.flightNumber || undefined,
            } : {}),
            total_price: data.total_price,
            currency: data.currency,
            notes: data.finalNotes,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown',
            status: data.status,
            priority: data.priority,
            lifecycle_status: 'active'
        })

        if (data.paidOnSale) {
            await useSalesStore.getState().collectPayment(hotel.id, saleId, data.total_price, data.currency)
        }

        if (data.shouldAddToNotes) {
            const noteContent = [
                t(saleTypeInfo[data.type].label as any), data.finalName,
                data.customer_name && `Misafir: ${data.customer_name}`,
                data.room_number && `Oda: ${data.room_number}`,
                `Satış: ${data.sale_date}`, `Hizmet: ${data.date}`,
                `Alış saati: ${data.pickup_time}`,
                `${data.total_price} ${data.currency}`, data.finalNotes
            ].filter(Boolean).join(' · ')
            await addNote(hotel.id, {
                category: 'payment_needed',
                content: noteContent,
                room_number: data.room_number,
                is_relevant: true,
                created_by: user.uid,
                created_by_name: user.name || 'Staff',
                guest_name: data.customer_name,
                shift_id: null,
                amount_due: data.total_price,
                is_paid: data.paidOnSale,
                currency: data.currency,
                sale_id: saleId,
                priority: data.priority
            })
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                        <button
                            onClick={() => setMainTab('sales')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shadow-xs transition-all"
                        >
                            <CreditCard className="size-3.5" />
                            <span>{language === 'tr' ? 'Satış Kayıtları' : 'Sales Records'}</span>
                        </button>
                        <button
                            onClick={() => setMainTab('tours')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
                        >
                            <MapPin className="size-3.5" />
                            <span>{language === 'tr' ? 'Tur Kataloğu' : 'Tour Catalogue'}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportCsv}
                            className="h-8 text-xs gap-1 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Satış Listesini CSV / Excel Olarak İndir"
                        >
                            <Download className="w-3.5 h-3.5 text-primary" />
                            Excel / CSV İndir
                        </Button>
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

                {/* Search Bar */}
                <div className="relative mt-3">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Rezervasyon No (#RES-...), Misafir Adı, Telefon, Oda veya Uçuş Kodu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-8 text-xs bg-background/70 border-border/60 focus:bg-background shadow-xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5 rounded-full hover:bg-muted"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4 p-3">
                {/* New Sale Modal */}
                <NewSaleModal
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    tours={tours}
                    hotelInfo={hotelInfo}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onAddSaleSubmit={handleAddSaleSubmit}
                />

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
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedSaleId(sale.id)}
                                    className={cn(
                                        'group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-[1px]',
                                        sale.status === 'cancelled' || sale.payment_status === 'cancelled' || sale.payment_status === 'refunded'
                                            ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                                            : sale.payment_status === 'paid'
                                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                                : sale.payment_status === 'partial'
                                                    ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                                                    : 'bg-card/90 border-border/80 hover:border-primary/40 hover:bg-card'
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
                                            {/* Header Row: Type Icon, Sale Title, Reservation Code Badge, Priority & Status Pulse */}
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:scale-105 transition-transform">
                                                    {saleTypeInfo[sale.type].icon}
                                                </div>
                                                <span className="font-bold text-foreground text-sm tracking-tight truncate">{sale.name}</span>

                                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center gap-1">
                                                    #{sale.reservation_code || ('RES-' + sale.id.slice(0, 6).toUpperCase())}
                                                </span>

                                                {sale.pax > 1 && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border shrink-0">
                                                        👥 {sale.pax} Pax
                                                    </span>
                                                )}

                                                {sale.priority && sale.priority !== 'low' && (
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase shrink-0",
                                                        sale.priority === 'critical' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                        sale.priority === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}>
                                                        {priorityInfo[sale.priority]?.symbol} {t(`priority.${sale.priority}` as any) as string}
                                                    </span>
                                                )}

                                                {sale.status !== 'cancelled' && remaining > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Kalan Borç
                                                    </span>
                                                )}
                                                
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="w-7 h-7 hover:bg-amber-500/20 hover:text-amber-400 transition-colors" 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedConfirmationSale(sale); }}
                                                        title="A4 Tur Rezervasyon Konfirme Belgesi (PDF)"
                                                    >
                                                        <FileText className="w-4 h-4 text-amber-400" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="w-7 h-7 hover:bg-primary/20 hover:text-primary transition-colors" 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedVoucherId(sale.id); }}
                                                        title="Digital Voucher Görüntüle ve Yazdır"
                                                    >
                                                        <Ticket className="w-4 h-4 text-primary" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Secondary Meta Details: Room, Guest Names, Date & Creator */}
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                {sale.room_number && (
                                                    <span className="bg-muted/80 text-foreground font-semibold px-2 py-0.5 rounded-md border border-border text-[11px]">
                                                        Oda {sale.room_number}
                                                    </span>
                                                )}
                                                {(() => {
                                                    const guests = parseGuestNames(sale.customer_name)
                                                    if (guests.length > 1) {
                                                        return (
                                                            <span className="font-medium text-foreground bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                                                                👥 {guests.join(', ')} ({guests.length} Misafir)
                                                            </span>
                                                        )
                                                    }
                                                    return <span className="font-medium text-foreground/90">{sale.customer_name || 'Misafir İsimsiz'}</span>
                                                })()}
                                                <span className="text-muted-foreground/40">•</span>
                                                <span>Hizmet: <strong className="text-foreground">{formatDisplayDate(sale.date)}</strong></span>
                                                <span className="text-muted-foreground/40">•</span>
                                                <span className="text-primary/90">{t('sales.soldBy', { name: sale.created_by_name })}</span>
                                            </div>
                                        </div>

                                        {/* Right Section: Price & Status */}
                                        <div className="text-right shrink-0">
                                            <div className="text-base font-extrabold text-foreground tracking-tight">
                                                {sale.currency === 'EUR' ? '€' : (sale.currency === 'TRY' ? '₺' : '$')}
                                                {sale.total_price}
                                                {!isTRYCurrency(sale.currency) && rates?.[sale.currency as keyof typeof rates] && (
                                                    <span className="block text-[10px] text-muted-foreground font-normal">
                                                        ≈ ₺{(sale.total_price * rates[sale.currency as keyof typeof rates]!.selling).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn("text-[11px] font-bold mt-0.5", paymentStatusInfo[sale.payment_status].color.replace('bg-', 'text-').split(' ')[1])}>
                                                {t(paymentStatusInfo[sale.payment_status].label as any)}
                                            </div>
                                            {/* Detailed Status Select */}
                                            <div onClick={(e) => e.stopPropagation()} className="mt-1.5">
                                                <Select
                                                    value={sale.status || 'waiting'}
                                                    onValueChange={(val: any) => {
                                                        if (hotel?.id) {
                                                            updateSale(hotel.id, sale.id, { status: val })
                                                        }
                                                     }}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-6 text-[10px] uppercase font-bold tracking-wider px-2 py-0 border-0 min-w-[95px] justify-between gap-1 transition-colors rounded-md shadow-xs",
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

            <TourConfirmationPdfModal
                isOpen={!!selectedConfirmationSale}
                onClose={() => setSelectedConfirmationSale(null)}
                sale={selectedConfirmationSale}
            />
        </Card >
    )
}
