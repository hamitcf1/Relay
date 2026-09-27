import { useState, useEffect, useMemo } from 'react'
import { Map, Plus, Save, Trash2, Calendar, Euro, Loader2, Edit3, X, Check, Table as TableIcon, LayoutGrid, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '@/stores/tourStore'
import { useSalesStore } from '@/stores/salesStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Tour } from '@/types'
import { format } from 'date-fns'
import { useWorkspaceDirty } from '@/hooks/useWorkspaceDirty'
import { toast } from 'sonner'

export type DayCode = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

const DAY_CONFIG: Array<{ code: DayCode; shortKey: string; fullKey: string }> = [
    { code: 'mon', shortKey: 'day.short.mon', fullKey: 'day.mon' },
    { code: 'tue', shortKey: 'day.short.tue', fullKey: 'day.tue' },
    { code: 'wed', shortKey: 'day.short.wed', fullKey: 'day.wed' },
    { code: 'thu', shortKey: 'day.short.thu', fullKey: 'day.thu' },
    { code: 'fri', shortKey: 'day.short.fri', fullKey: 'day.fri' },
    { code: 'sat', shortKey: 'day.short.sat', fullKey: 'day.sat' },
    { code: 'sun', shortKey: 'day.short.sun', fullKey: 'day.sun' }
]

/**
 * Robustly parses and normalizes any legacy day formats (e.g. "monday tuesday...", ["day.mon"], ["mon"])
 * into standard DayCode array ['mon', 'tue', ...]
 */
export function normalizeOperatingDays(raw: string[] | string | undefined | null): DayCode[] {
    if (!raw) return []
    const strList = Array.isArray(raw) ? raw.join(' ') : String(raw)
    const lower = strList.toLowerCase()

    const result: DayCode[] = []
    if (lower.includes('mon') || lower.includes('pazartesi') || lower.includes('pzt')) result.push('mon')
    if (lower.includes('tue') || lower.includes('salı') || lower.includes('sali') || lower.includes('sal')) result.push('tue')
    if (lower.includes('wed') || lower.includes('çarşamba') || lower.includes('carsamba') || lower.includes('çar')) result.push('wed')
    if (lower.includes('thu') || lower.includes('perşembe') || lower.includes('persembe') || lower.includes('per')) result.push('thu')
    if (lower.includes('fri') || lower.includes('cuma') || lower.includes('cum')) result.push('fri')
    if (lower.includes('sat') || lower.includes('cumartesi') || lower.includes('cts')) result.push('sat')
    if (lower.includes('sun') || lower.includes('pazar') || lower.includes('paz')) result.push('sun')

    return Array.from(new Set(result))
}

export function TourCatalogue() {
    const { t } = useLanguageStore()
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { tours, subscribeToTours, addTour, updateTour, deleteTour, loading } = useTourStore()
    const { addSale } = useSalesStore()

    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null) // Modal edit
    const [inlineEditingId, setInlineEditingId] = useState<string | null>(null) // Table inline edit
    const [inlineData, setInlineData] = useState<Partial<Tour>>({})

    const [formData, setFormData] = useState<Omit<Tour, 'id'>>({
        name: '',
        description: '',
        base_price_eur: 0,
        adult_price: 0,
        child_3_7_price: 0,
        child_0_3_price: 0,
        operating_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        is_active: true
    })

    // Booking Modal State
    const [bookingTour, setBookingTour] = useState<Tour | null>(null)
    const [bookingType, setBookingType] = useState<'adult' | 'child_3_7' | 'child_0_3'>('adult')
    const [bookingForm, setBookingForm] = useState({
        guest_name: '',
        guest_phone: '',
        room_number: '',
        pax: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        pickup_time: ''
    })

    const isGM = user?.role === 'gm'
    const bookingDirty = Boolean(bookingTour && (bookingForm.guest_name.trim() || bookingForm.room_number.trim() || bookingForm.pickup_time || bookingForm.pax !== 1))
    useWorkspaceDirty('tour-catalogue', Boolean(isAdding || editingId || inlineEditingId) || bookingDirty)

    useEffect(() => {
        if (hotel?.id) {
            const unsub = subscribeToTours(hotel.id)
            return () => unsub()
        }
    }, [hotel?.id, subscribeToTours])

    const handleSaveForm = async () => {
        if (!hotel?.id) return
        if (!formData.name.trim()) {
            toast.error('Lütfen tur adını giriniz.')
            return
        }
        try {
            if (editingId) {
                await updateTour(hotel.id, editingId, formData)
                toast.success('Tur güncellendi.')
                setEditingId(null)
            } else {
                await addTour(hotel.id, formData)
                toast.success('Yeni tur eklendi.')
                setIsAdding(false)
            }
            // Reset form
            setFormData({
                name: '',
                description: '',
                base_price_eur: 0,
                adult_price: 0,
                child_3_7_price: 0,
                child_0_3_price: 0,
                operating_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                is_active: true
            })
        } catch (error) {
            console.error("Save tour error:", error)
            toast.error('Tur kaydedilirken hata oluştu.')
        }
    }

    const handleSaveInline = async (tourId: string) => {
        if (!hotel?.id) return
        try {
            await updateTour(hotel.id, tourId, inlineData)
            toast.success('Tur bilgileri güncellendi.')
            setInlineEditingId(null)
            setInlineData({})
        } catch (error) {
            console.error("Inline save error:", error)
            toast.error('Güncelleme başarısız.')
        }
    }

    const startInlineEdit = (tour: Tour) => {
        setInlineEditingId(tour.id)
        setInlineData({
            name: tour.name,
            description: tour.description,
            base_price_eur: tour.base_price_eur || 0,
            adult_price: tour.adult_price || 0,
            child_3_7_price: tour.child_3_7_price || 0,
            child_0_3_price: tour.child_0_3_price || 0,
            operating_days: normalizeOperatingDays(tour.operating_days)
        })
    }

    const openBookingModal = (tour: Tour, type: 'adult' | 'child_3_7' | 'child_0_3') => {
        setBookingTour(tour)
        setBookingType(type)
        setBookingForm({
            guest_name: '',
            guest_phone: '',
            room_number: '',
            pax: 1,
            date: format(new Date(), 'yyyy-MM-dd'),
            pickup_time: ''
        })
    }

    const confirmBooking = async () => {
        if (!hotel?.id || !user || !bookingTour) return

        let pricePerPax = bookingTour.adult_price
        if (bookingType === 'child_3_7') pricePerPax = bookingTour.child_3_7_price
        if (bookingType === 'child_0_3') pricePerPax = bookingTour.child_0_3_price

        const totalPrice = pricePerPax * bookingForm.pax

        try {
            await addSale(hotel.id, {
                type: 'tour',
                name: `${bookingTour.name} (${bookingType === 'adult' ? t('tours.form.adultPrice') : bookingType === 'child_3_7' ? t('tours.form.child37Price') : t('tours.form.child03Price')})`,
                customer_name: bookingForm.guest_name,
                customer_phone: bookingForm.guest_phone || undefined,
                room_number: bookingForm.room_number,
                pax: bookingForm.pax,
                date: new Date(bookingForm.date),
                pickup_time: bookingForm.pickup_time || undefined,
                total_price: totalPrice,
                currency: 'EUR',
                created_by: user.uid,
                created_by_name: user.name,
                notes: t('tours.clickToLog')
            })
            toast.success('Tur satışı kaydedildi.')
            setBookingTour(null)
        } catch (error) {
            console.error("Booking error:", error)
            toast.error('Satış kaydedilemedi.')
        }
    }

    const sortedTours = useMemo(() => {
        return [...tours].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }, [tours])

    return (
        <section className="mx-auto w-full max-w-[90rem] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header & Controls */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Map className="w-6 h-6 text-primary" />
                        {t('tours.catalogue.title')}
                    </h2>
                    <p className="text-muted-foreground text-sm">{t('tours.catalogue.desc')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Switcher */}
                    <div className="flex items-center bg-background/60 rounded-xl p-1 border border-border/50 shadow-sm">
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className={cn("h-8 gap-2 text-xs font-semibold rounded-lg", viewMode === 'table' && "shadow-md bg-primary text-primary-foreground")}
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                            {t('tours.view.table')}
                        </Button>
                        <Button
                            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className={cn("h-8 gap-2 text-xs font-semibold rounded-lg", viewMode === 'cards' && "shadow-md bg-primary text-primary-foreground")}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            {t('tours.view.cards')}
                        </Button>
                    </div>

                    {isGM && !isAdding && (
                        <Button onClick={() => setIsAdding(true)} className="gap-2 h-9 text-xs">
                            <Plus className="w-4 h-4" />
                            {t('tours.add')}
                        </Button>
                    )}
                </div>
            </header>

            {/* CREATE / EDIT MODAL CARD */}
            <AnimatePresence>
                {(isAdding || editingId) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card className="bg-card border-primary/30 shadow-xl overflow-hidden relative">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 py-4 bg-muted/20">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    {editingId ? t('tours.edit') : t('tours.create')}
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsAdding(false); setEditingId(null); }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">{t('tours.form.name')}</label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Örn: Pamukkale Günlük Turu"
                                            className="bg-background border-border"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">{t('tours.form.desc')}</label>
                                        <Input
                                            value={formData.description}
                                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Örn: Öğle yemeği ve rehber dahil VIP tur"
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1">
                                            <Euro className="w-3 h-3 text-primary" /> {t('tours.form.basePrice')}
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.base_price_eur}
                                            onChange={e => setFormData(p => ({ ...p, base_price_eur: parseFloat(e.target.value) || 0 }))}
                                            className="bg-background border-border font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">{t('tours.form.adultPrice')}</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.adult_price}
                                            onChange={e => setFormData(p => ({ ...p, adult_price: parseFloat(e.target.value) || 0 }))}
                                            className="bg-background border-border font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground uppercase font-bold text-amber-500">{t('tours.form.child37Price')}</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.child_3_7_price}
                                            onChange={e => setFormData(p => ({ ...p, child_3_7_price: parseFloat(e.target.value) || 0 }))}
                                            className="bg-background border-border font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground uppercase font-bold text-emerald-500">{t('tours.form.child03Price')}</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.child_0_3_price}
                                            onChange={e => setFormData(p => ({ ...p, child_0_3_price: parseFloat(e.target.value) || 0 }))}
                                            className="bg-background border-border font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">{t('tours.form.operatingDays')}</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DAY_CONFIG.map(({ code, shortKey }) => {
                                            const currentNormalized = normalizeOperatingDays(formData.operating_days)
                                            const isSelected = currentNormalized.includes(code)
                                            return (
                                                <button
                                                    key={code}
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = isSelected
                                                            ? currentNormalized.filter((d) => d !== code)
                                                            : [...currentNormalized, code]
                                                        setFormData((p) => ({ ...p, operating_days: updated }))
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground shadow-sm scale-105"
                                                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    {t(shortKey as any)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                                    <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>{t('common.cancel')}</Button>
                                    <Button className="px-6" onClick={handleSaveForm}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingId ? t('common.update') : t('common.save')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : sortedTours.length === 0 ? (
                <div className="py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
                    <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                    <p className="text-muted-foreground font-medium">{t('tours.noTours')}</p>
                    {isGM && <Button variant="link" className="text-primary mt-2" onClick={() => setIsAdding(true)}>{t('tours.createFirst')}</Button>}
                </div>
            ) : viewMode === 'table' ? (
                /* ==========================================
                 * VIEW MODE 1: MATRIX TABLE VIEW
                 * ========================================== */
                <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-2xl relative">
                    <CardHeader className="py-4 border-b border-border/30 bg-muted/20">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <TableIcon className="w-5 h-5 text-primary" />
                                {t('tours.catalogue.title')} Fiyat & Detay Matrisi
                            </span>
                            <Badge variant="outline" className="text-xs font-mono">
                                Toplam {sortedTours.length} Tur
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30">
                                    <tr>
                                        <th className="p-3.5 pl-6 min-w-[220px]">{t('tours.table.name')}</th>
                                        <th className="p-3.5 min-w-[160px]">{t('tours.table.days')}</th>
                                        <th className="p-3.5 text-center min-w-[100px]">{t('tours.table.base')}</th>
                                        <th className="p-3.5 text-center min-w-[110px]">{t('tours.table.adult')}</th>
                                        <th className="p-3.5 text-center min-w-[110px]">{t('tours.table.child37')}</th>
                                        <th className="p-3.5 text-center min-w-[110px]">{t('tours.table.child03')}</th>
                                        <th className="p-3.5 text-right pr-6 min-w-[160px]">{t('tours.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {sortedTours.map((tour) => {
                                        const isEditingRow = inlineEditingId === tour.id
                                        const daysList = normalizeOperatingDays(isEditingRow ? inlineData.operating_days : tour.operating_days)

                                        return (
                                            <tr
                                                key={tour.id}
                                                className={cn(
                                                    "transition-colors group/row",
                                                    isEditingRow ? "bg-primary/10" : "hover:bg-primary/5"
                                                )}
                                            >
                                                {/* Tour Name & Description */}
                                                <td className="p-3.5 pl-6">
                                                    {isEditingRow ? (
                                                        <div className="space-y-1">
                                                            <Input
                                                                value={inlineData.name || ''}
                                                                onChange={(e) => setInlineData((p) => ({ ...p, name: e.target.value }))}
                                                                placeholder="Tur Adı"
                                                                className="h-8 text-xs font-bold"
                                                            />
                                                            <Input
                                                                value={inlineData.description || ''}
                                                                onChange={(e) => setInlineData((p) => ({ ...p, description: e.target.value }))}
                                                                placeholder="Açıklama"
                                                                className="h-7 text-[11px]"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-sm text-foreground">{tour.name}</div>
                                                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {tour.description || 'Açıklama girilmedi.'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Operating Days Badges */}
                                                <td className="p-3.5">
                                                    {isEditingRow ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {DAY_CONFIG.map(({ code, shortKey }) => {
                                                                const isSel = daysList.includes(code)
                                                                return (
                                                                    <button
                                                                        key={code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const nextDays = isSel
                                                                                ? daysList.filter((d) => d !== code)
                                                                                : [...daysList, code]
                                                                            setInlineData((p) => ({ ...p, operating_days: nextDays }))
                                                                        }}
                                                                        className={cn(
                                                                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                                                            isSel ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {t(shortKey as any)}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {daysList.length > 0 ? (
                                                                daysList.map((code) => {
                                                                    const cfg = DAY_CONFIG.find((d) => d.code === code)
                                                                    return (
                                                                        <span
                                                                            key={code}
                                                                            className="text-[9px] px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded-md font-bold uppercase border border-border/30"
                                                                        >
                                                                            {cfg ? t(cfg.shortKey as any) : code}
                                                                        </span>
                                                                    )
                                                                })
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground italic">Her Gün</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Base EUR */}
                                                <td className="p-3.5 text-center">
                                                    {isEditingRow ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={inlineData.base_price_eur ?? 0}
                                                            onChange={(e) => setInlineData((p) => ({ ...p, base_price_eur: parseFloat(e.target.value) || 0 }))}
                                                            className="h-8 w-20 text-center font-mono text-xs mx-auto"
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-muted-foreground">
                                                            €{(tour.base_price_eur || 0).toFixed(2)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Adult Price */}
                                                <td className="p-3.5 text-center">
                                                    {isEditingRow ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={inlineData.adult_price ?? 0}
                                                            onChange={(e) => setInlineData((p) => ({ ...p, adult_price: parseFloat(e.target.value) || 0 }))}
                                                            className="h-8 w-20 text-center font-mono font-bold text-primary text-xs mx-auto"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-bold text-sm text-primary">
                                                            €{(tour.adult_price || 0).toFixed(2)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Child 3-7 Price */}
                                                <td className="p-3.5 text-center">
                                                    {isEditingRow ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={inlineData.child_3_7_price ?? 0}
                                                            onChange={(e) => setInlineData((p) => ({ ...p, child_3_7_price: parseFloat(e.target.value) || 0 }))}
                                                            className="h-8 w-20 text-center font-mono font-bold text-amber-500 text-xs mx-auto"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-bold text-sm text-amber-500">
                                                            €{(tour.child_3_7_price || 0).toFixed(2)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Child 0-3 Price */}
                                                <td className="p-3.5 text-center">
                                                    {isEditingRow ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={inlineData.child_0_3_price ?? 0}
                                                            onChange={(e) => setInlineData((p) => ({ ...p, child_0_3_price: parseFloat(e.target.value) || 0 }))}
                                                            className="h-8 w-20 text-center font-mono font-bold text-emerald-500 text-xs mx-auto"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-bold text-sm text-emerald-500">
                                                            €{(tour.child_0_3_price || 0).toFixed(2)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3.5 text-right pr-6">
                                                    {isEditingRow ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:bg-destructive/10"
                                                                onClick={() => { setInlineEditingId(null); setInlineData({}); }}
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1"
                                                                onClick={() => handleSaveInline(tour.id)}
                                                            >
                                                                <Save className="w-3.5 h-3.5" />
                                                                Kaydet
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                                                onClick={() => openBookingModal(tour, 'adult')}
                                                            >
                                                                <Calendar className="w-3 h-3" />
                                                                {t('tours.book.action')}
                                                            </Button>

                                                            {isGM && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 text-xs border-border/50"
                                                                        onClick={() => startInlineEdit(tour)}
                                                                        title="Hızlı Düzenle"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                                        Düzenle
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                        onClick={async () => {
                                                                            if (hotel?.id) {
                                                                                await deleteTour(hotel.id, tour.id)
                                                                                toast.success(`${tour.name} silindi.`)
                                                                            }
                                                                        }}
                                                                        title="Sil"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* ==========================================
                 * VIEW MODE 2: CATALOGUE CARD GRID VIEW
                 * ========================================== */
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {sortedTours.map((tour) => {
                        const daysList = normalizeOperatingDays(tour.operating_days)

                        return (
                            <motion.div key={tour.id} layout>
                                <Card className="bg-card border-border hover:border-primary/50 transition-all overflow-hidden flex flex-col h-full group shadow-md">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                {t('tours.local')}
                                            </Badge>
                                            {isGM && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => {
                                                            setEditingId(tour.id)
                                                            setFormData({
                                                                name: tour.name,
                                                                description: tour.description,
                                                                base_price_eur: tour.base_price_eur || 0,
                                                                adult_price: tour.adult_price || 0,
                                                                child_3_7_price: tour.child_3_7_price || 0,
                                                                child_0_3_price: tour.child_0_3_price || 0,
                                                                operating_days: daysList,
                                                                is_active: tour.is_active ?? true
                                                            })
                                                        }}
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => hotel?.id && deleteTour(hotel.id, tour.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <CardTitle className="text-foreground text-lg">{tour.name}</CardTitle>
                                        <CardDescription className="text-xs line-clamp-2">{tour.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-2 flex-1 flex flex-col">
                                        {/* Days Badges */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {daysList.map((code) => {
                                                const cfg = DAY_CONFIG.find((d) => d.code === code)
                                                return (
                                                    <span
                                                        key={code}
                                                        className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md font-bold uppercase border border-border/20"
                                                    >
                                                        {cfg ? t(cfg.shortKey as any) : code}
                                                    </span>
                                                )
                                            })}
                                        </div>

                                        {/* Price Buttons */}
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openBookingModal(tour, 'adult')}
                                                className="group/price w-full rounded-xl border border-border bg-muted/30 p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{t('tours.form.adultPrice')}</span>
                                                    <Calendar className="w-3 h-3 text-muted-foreground group-hover/price:text-primary opacity-0 group-hover/price:opacity-100 transition-all" />
                                                </div>
                                                <p className="text-lg font-bold text-foreground">
                                                    €{(tour.adult_price || 0).toLocaleString()}
                                                    <span className="text-xs text-muted-foreground ml-1 font-normal">(Maliyet: €{tour.base_price_eur || 0})</span>
                                                </p>
                                            </button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openBookingModal(tour, 'child_3_7')}
                                                    className="group/price rounded-xl border border-border bg-muted/30 p-2.5 text-left transition-all hover:border-amber-500/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{t('tours.form.child37Price')}</p>
                                                    <p className="text-sm font-bold text-amber-500">€{tour.child_3_7_price || 0}</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openBookingModal(tour, 'child_0_3')}
                                                    className="group/price rounded-xl border border-border bg-muted/30 p-2.5 text-left transition-all hover:border-emerald-500/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{t('tours.form.child03Price')}</p>
                                                    <p className="text-sm font-bold text-emerald-500">€{tour.child_0_3_price || 0}</p>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-border/50">
                                            <p className="text-[10px] text-muted-foreground italic text-center">{t('tours.clickToLog')}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* BOOKING MODAL */}
            <Dialog open={!!bookingTour} onOpenChange={(open) => !open && setBookingTour(null)}>
                <DialogContent className="bg-card border-border sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {t('tours.book.title', { name: bookingTour?.name || '' })}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs">
                            {t('tours.book.desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t('tours.book.guestName')}</label>
                                <Input
                                    value={bookingForm.guest_name}
                                    onChange={e => setBookingForm(p => ({ ...p, guest_name: e.target.value }))}
                                    className="bg-background border-border text-xs"
                                    placeholder={t('auth.name')}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Misafir Tel No</label>
                                <Input
                                    value={bookingForm.guest_phone}
                                    onChange={e => setBookingForm(p => ({ ...p, guest_phone: e.target.value }))}
                                    className="bg-background border-border text-xs"
                                    placeholder="+90 532 ..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t('tours.book.room')}</label>
                                <Input
                                    value={bookingForm.room_number}
                                    onChange={e => setBookingForm(p => ({ ...p, room_number: e.target.value }))}
                                    className="bg-background border-border text-xs"
                                    placeholder="101"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t('tours.book.pax')}</label>
                                <Input
                                    type="number"
                                    value={bookingForm.pax}
                                    onChange={e => setBookingForm(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))}
                                    className="bg-background border-border text-xs"
                                    min={1}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t('tours.book.date')}</label>
                                <Input
                                    type="date"
                                    value={bookingForm.date}
                                    onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                                    className="bg-background border-border text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Kalkış Saati</label>
                                <Input
                                    type="time"
                                    value={bookingForm.pickup_time}
                                    onChange={e => setBookingForm(p => ({ ...p, pickup_time: e.target.value }))}
                                    className="bg-background border-border text-xs"
                                />
                            </div>
                        </div>
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary">
                                {t('tours.book.totalPrice')}
                            </span>
                            <span className="text-lg font-black text-foreground">€{bookingTour ? (
                                (bookingType === 'adult' ? bookingTour.adult_price :
                                    bookingType === 'child_3_7' ? bookingTour.child_3_7_price :
                                        bookingTour.child_0_3_price) * bookingForm.pax
                            ) : 0}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setBookingTour(null)}>{t('common.cancel')}</Button>
                        <Button onClick={confirmBooking} disabled={!bookingForm.guest_name || !bookingForm.room_number}>
                            <Check className="w-4 h-4 mr-1" /> {t('tours.book.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
