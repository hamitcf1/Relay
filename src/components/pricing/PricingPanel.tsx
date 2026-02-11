import { useState, useEffect } from 'react'
import { format, parseISO, addDays as addDaysFns } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import {
    Save,
    Loader2,
    Building2,
    Plus,
    Trash2,
    Calendar,
    Search,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    Euro as EuroIcon,
    Zap,
    Users,
    Sparkles
} from 'lucide-react'
import { usePricingStore } from '@/stores/pricingStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { RoomType, PricingCurrency, RoomPriceEntry, Agency, AgencyOverride, BaseOverride } from '@/types'

const ROOM_TYPES: RoomType[] = ['standard', 'corner', 'corner_jacuzzi', 'triple', 'teras_suite']

export function PricingPanel() {
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const isGM = user?.role === 'gm'
    const hotelId = user?.hotel_id

    const {
        basePrices,
        baseOverrides,
        agencies,
        loading,
        subscribeToBasePrices,
        subscribeToBaseOverrides,
        subscribeToAgencies,
        addAgency,
        removeAgency
    } = usePricingStore()

    const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null)
    const selectedAgency = agencies.find(a => a.id === selectedAgencyId)

    if (!user || !hotelId) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    useEffect(() => {
        if (!hotelId) return
        const unsubBase = subscribeToBasePrices(hotelId)
        const unsubOverrides = subscribeToBaseOverrides(hotelId)
        const unsubAgencies = subscribeToAgencies(hotelId)
        return () => {
            unsubBase()
            unsubOverrides()
            unsubAgencies()
        }
    }, [hotelId, subscribeToBasePrices, subscribeToBaseOverrides, subscribeToAgencies])

    if (loading && !basePrices) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Grid: Defaults & Bulk Editor */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <BasePriceManager isGM={isGM} />
                {isGM ? <BulkRateEditor hotelId={hotelId!} /> : <PriceLookup />}
            </div>

            {/* AI Agent Section (GM Only) */}
            {isGM && <AIPricingAgent hotelId={hotelId!} />}

            {/* Global Overrides (Everyone) */}
            <GlobalOverrideManager
                baseOverrides={baseOverrides}
                isGM={isGM}
                hotelId={hotelId!}
            />

            {/* Agencies Section */}
            <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                {t('pricing.agencies.title')}
                            </CardTitle>
                            <CardDescription>{t('pricing.agencies.desc')}</CardDescription>
                        </div>
                        {isGM && !selectedAgencyId && (
                            <AddAgencyDialog onAdd={async (name) => {
                                if (hotelId) await addAgency(hotelId, name)
                            }} />
                        )}
                        {selectedAgencyId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAgencyId(null)}
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to List
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        {!selectedAgencyId ? (
                            <div className="divide-y divide-border/50">
                                {agencies.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground italic">
                                        {t('pricing.agencies.empty')}
                                    </div>
                                ) : (
                                    agencies.map(agency => (
                                        <div
                                            key={agency.id}
                                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                            onClick={() => setSelectedAgencyId(agency.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {agency.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {agency.overrides.length} special ranges defined
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {isGM && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm(`Remove ${agency.name}?`)) {
                                                                if (hotelId) removeAgency(hotelId, agency.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : selectedAgency ? (
                            <AgencyOverrideManager
                                agency={selectedAgency}
                                isGM={isGM}
                                hotelId={hotelId!}
                            />
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <p>Agency not found or loading...</p>
                                <Button
                                    variant="link"
                                    onClick={() => setSelectedAgencyId(null)}
                                >
                                    Back to List
                                </Button>
                            </div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    )
}

function AIPricingAgent({ hotelId }: { hotelId: string }) {
    const { t } = useLanguageStore()
    const { agencies, setBaseOverride, setAgencyOverride } = usePricingStore()
    const [input, setInput] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const parseAndApply = async () => {
        if (!input.trim()) return
        setIsProcessing(true)
        setStatus('Analyzing input...')

        try {
            // Simple heuristic parser for demo/functionality
            // Expected format: Date Range | Agency | Room Values
            // Example: 2024-06-01 to 2024-06-15 | Everyone | standard: 120, triple: 180

            const lines = input.split('\n').filter(l => l.trim())
            for (const line of lines) {
                // Support both pipe-separated and comma/tab-like structures
                let parts = line.split('|').map(p => p.trim())

                // If not pipe, try common delimiters
                if (parts.length < 3) {
                    if (line.includes('\t')) {
                        parts = line.split('\t').map(p => p.trim())
                    }
                }

                if (parts.length < 3) continue

                const datePart = parts[0] // e.g. "2024-06-01 to 2024-06-15"
                const targetPart = parts[1] // e.g. "Everyone" or "Booking.com"
                const pricePart = parts[2] // e.g. "standard: 120, triple: 180"

                const dates = datePart.split(/to|\s-\s/).map(d => d.trim())
                const start = dates[0]
                const end = dates[1] || dates[0]

                const prices: Record<string, RoomPriceEntry> = {}
                pricePart.split(',').forEach(p => {
                    const [room, val] = p.split(':').map(s => s.trim().toLowerCase())
                    const amount = parseFloat(val)
                    if (room && !isNaN(amount)) {
                        const matchedRoom = ROOM_TYPES.find(r => r.includes(room) || room.includes(r))
                        if (matchedRoom) {
                            prices[matchedRoom] = { amount, currency: 'EUR' }
                        }
                    }
                })

                if (Object.keys(prices).length > 0) {
                    const override = {
                        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        start_date: start,
                        end_date: end,
                        prices
                    }

                    if (targetPart.toLowerCase() === 'everyone') {
                        await setBaseOverride(hotelId, override)
                    } else {
                        const agency = agencies.find(a => a.name.toLowerCase().includes(targetPart.toLowerCase()))
                        if (agency) {
                            await setAgencyOverride(hotelId, agency.id, override)
                        }
                    }
                }
            }
            setStatus('Prices applied successfully!')
            setInput('')
            setTimeout(() => setStatus(null), 3000)
        } catch (error) {
            console.error(error)
            setStatus('Error parsing input. Please check format.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Card className="border-primary/30 bg-primary/5 border-2">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t('pricing.ai.title') || 'AI Pricing Agent'}
                </CardTitle>
                <CardDescription>
                    {t('pricing.ai.desc') || 'Paste date ranges and prices in text or table format. Example: 2024-07-01 to 2024-07-31 | Everyone | standard: 150, triple: 220'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="Enter prices here... (Format: Start to End | Agency | room:price, ...)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[100px] font-mono text-sm bg-background/50"
                />
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground italic">
                        {status || 'Supports plain text lines or pipe-separated values.'}
                    </p>
                    <Button
                        size="sm"
                        onClick={parseAndApply}
                        disabled={isProcessing || !input.trim()}
                        className="gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Apply with AI
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function BulkRateEditor({ hotelId }: { hotelId: string }) {
    const { t } = useLanguageStore()
    const { agencies, setBaseOverride, setAgencyOverride } = usePricingStore()
    const [target, setTarget] = useState<'everyone' | string>('everyone')
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(addDaysFns(new Date(), 7), 'yyyy-MM-dd'))
    const [prices, setPrices] = useState<Record<string, RoomPriceEntry>>({})
    const [isSaving, setIsSaving] = useState(false)

    const handleApply = async () => {
        if (!startDate || !endDate) return
        setIsSaving(true)
        try {
            const overrideData = {
                id: `bulk_${Date.now()}`,
                start_date: startDate,
                end_date: endDate,
                prices
            }

            if (target === 'everyone') {
                await setBaseOverride(hotelId, overrideData)
            } else {
                await setAgencyOverride(hotelId, target, overrideData)
            }
            alert(t('pricing.save.success'))
        } catch (error) {
            alert(t('pricing.save.error'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl border-dashed">
            <CardHeader className="pb-2">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        {t('pricing.bulk.title') || 'Bulk Rate Editor'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {t('pricing.bulk.desc') || 'Apply prices to a date range for everyone or an agency'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('pricing.lookup.agency')}</label>
                        <Select value={target} onValueChange={setTarget}>
                            <SelectTrigger className="h-9 bg-background/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="everyone">{t('pricing.bulk.everyone') || 'Everyone'}</SelectItem>
                                {agencies.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('pricing.date.start')}</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 bg-background/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('pricing.date.end')}</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 bg-background/50" />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {ROOM_TYPES.map(room => (
                        <div key={room} className="p-2 rounded-lg bg-background/40 border border-border/50">
                            <label className="text-[10px] font-medium block mb-1 truncate capitalize">{t(`room.${room}`)}</label>
                            <div className="flex gap-1">
                                <Input
                                    type="number"
                                    className="h-7 text-xs text-right font-mono p-1"
                                    placeholder="0"
                                    value={prices[room]?.amount || ''}
                                    onChange={e => setPrices(p => ({ ...p, [room]: { ...(p[room] || { currency: 'EUR' }), amount: parseFloat(e.target.value) || 0 } }))}
                                />
                                <Select
                                    value={prices[room]?.currency || 'EUR'}
                                    onValueChange={val => setPrices(p => ({ ...p, [room]: { ...(p[room] || { amount: 0 }), currency: val as PricingCurrency } }))}
                                >
                                    <SelectTrigger className="h-7 w-12 px-1 text-[10px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>

                <Button className="w-full h-9 gap-2" size="sm" onClick={handleApply} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('pricing.bulk.apply') || 'Apply Range Prices'}
                </Button>
            </CardContent>
        </Card>
    )
}

function GlobalOverrideManager({ baseOverrides, isGM, hotelId }: { baseOverrides: BaseOverride[], isGM: boolean, hotelId: string }) {
    const { t } = useLanguageStore()
    const { removeBaseOverride } = usePricingStore()

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="py-4 border-b border-border/30">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    {t('pricing.global_overrides.title') || 'Special Periods (Everyone)'}
                </CardTitle>
                <CardDescription className="text-xs">
                    {t('pricing.global_overrides.desc') || 'Prices defined here apply to all agencies during the specified dates.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                    {baseOverrides.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm italic">
                            No global overrides defined.
                        </div>
                    ) : (
                        baseOverrides
                            .sort((a, b) => b.start_date.localeCompare(a.start_date))
                            .map(override => (
                                <div key={override.id} className="p-4 flex items-center justify-between group hover:bg-muted/30">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 font-mono text-sm font-bold">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {override.start_date} <span className="text-muted-foreground mx-1">→</span> {override.end_date}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {ROOM_TYPES.map(room => (
                                                <div key={room} className="text-[10px] flex items-center gap-1">
                                                    <span className="text-muted-foreground capitalize">{t(`room.${room}`)}:</span>
                                                    <span className="font-bold">
                                                        {override.prices[room]?.currency === 'USD' ? '$' : '€'}
                                                        {override.prices[room]?.amount || '---'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {isGM && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (confirm('Delete this global override?')) {
                                                    removeBaseOverride(hotelId, override.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function BasePriceManager({ isGM }: { isGM: boolean }) {
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const { basePrices, setBasePrices } = usePricingStore()
    const [prices, setPrices] = useState<Record<string, RoomPriceEntry>>({})
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (basePrices?.prices) {
            setPrices(basePrices.prices as Record<string, RoomPriceEntry>)
        }
    }, [basePrices])

    const handleSave = async () => {
        if (!user?.hotel_id) return
        setIsSaving(true)
        try {
            await setBasePrices(user.hotel_id, prices, user.uid)
            alert(t('pricing.save.success'))
        } catch (error) {
            alert(t('pricing.save.error'))
        } finally {
            setIsSaving(false)
        }
    }

    const updatePrice = (room: RoomType, amount: number) => {
        setPrices(prev => ({
            ...prev,
            [room]: { ...(prev[room] || { currency: 'EUR' }), amount }
        }))
    }

    const updateCurrency = (room: RoomType, currency: PricingCurrency) => {
        setPrices(prev => ({
            ...prev,
            [room]: { ...(prev[room] || { amount: 0 }), currency }
        }))
    }

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            {t('pricing.base.title')}
                        </CardTitle>
                        <CardDescription>{t('pricing.base.desc')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    {ROOM_TYPES.map(room => (
                        <div key={room} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 group">
                            <span className="text-sm font-medium capitalize flex-1">
                                {t(`room.${room}`)}
                            </span>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={prices[room]?.amount || 0}
                                    onChange={(e) => updatePrice(room, parseFloat(e.target.value) || 0)}
                                    disabled={!isGM || isSaving}
                                    className="w-24 h-9 bg-background/50 text-right font-mono"
                                />
                                <Select
                                    value={prices[room]?.currency || 'EUR'}
                                    onValueChange={(val) => updateCurrency(room, val as PricingCurrency)}
                                    disabled={!isGM || isSaving}
                                >
                                    <SelectTrigger className="w-20 h-9 bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
                {isGM && (
                    <Button
                        onClick={handleSave}
                        className="w-full mt-4 gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {t('pricing.save.success')}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

function PriceLookup() {
    const { t } = useLanguageStore()
    const { agencies, getEffectivePrice } = usePricingStore()
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [agencyId, setAgencyId] = useState<string>('base')

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl border-primary/20">
            <CardHeader>
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        {t('pricing.lookup.title')}
                    </CardTitle>
                    <CardDescription>{t('pricing.lookup.desc')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pricing.lookup.date')}</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pricing.lookup.agency')}</label>
                        <Select value={agencyId} onValueChange={setAgencyId}>
                            <SelectTrigger className="bg-background/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="base">--- {t('pricing.base.title')} ---</SelectItem>
                                {agencies.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-muted/20 overflow-hidden">
                    {ROOM_TYPES.map(room => {
                        const price = getEffectivePrice(date, room, agencyId === 'base' ? undefined : agencyId)
                        const isOverride = agencyId !== 'base' && price !== getEffectivePrice(date, room)

                        return (
                            <div key={room} className="flex justify-between items-center p-4">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium capitalize">{t(`room.${room}`)}</div>
                                    <div className={cn(
                                        "text-[10px] font-bold uppercase tracking-tighter inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
                                        isOverride ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {isOverride ? (
                                            <><CheckCircle2 className="w-2.5 h-2.5" /> {t('pricing.lookup.overrideUsed')}</>
                                        ) : (
                                            <><CheckCircle2 className="w-2.5 h-2.5" /> {t('pricing.lookup.basePriceUsed')}</>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold font-mono tracking-tight flex items-center justify-end">
                                        {price?.currency === 'USD' ? <DollarSign className="w-4 h-4 inline" /> : <EuroIcon className="w-4 h-4 inline" />}
                                        {price?.amount || '---'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase">{t('pricing.perNight')}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

function AgencyOverrideManager({ agency, isGM, hotelId }: { agency: Agency, isGM: boolean, hotelId: string }) {
    const { t } = useLanguageStore()
    const { setAgencyOverride, removeAgencyOverride } = usePricingStore()
    const [isAdding, setIsAdding] = useState(false)

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        {agency.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t('pricing.overrides.title')}</p>
                </div>
                {isGM && !isAdding && (
                    <Button size="sm" onClick={() => setIsAdding(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t('pricing.overrides.add')}
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="border border-primary/30 bg-primary/5 rounded-2xl p-4 animate-in zoom-in-95 duration-200">
                    <OverrideEditor
                        onSave={async (override) => {
                            await setAgencyOverride(hotelId, agency.id, override)
                            setIsAdding(false)
                        }}
                        onCancel={() => setIsAdding(false)}
                    />
                </div>
            )}

            <div className="space-y-4">
                {agency.overrides.length === 0 && !isAdding ? (
                    <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed border-border/30 rounded-2xl">
                        {t('pricing.overrides.empty')}
                    </div>
                ) : (
                    agency.overrides
                        .sort((a, b) => b.start_date.localeCompare(a.start_date))
                        .map(override => (
                            <Card key={override.id} className="border-border/50 bg-background/50">
                                <CardHeader className="py-3 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-mono text-sm">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {format(parseISO(override.start_date), 'MMM dd, yyyy')}
                                            <span className="text-muted-foreground mx-1">→</span>
                                            {format(parseISO(override.end_date), 'MMM dd, yyyy')}
                                        </div>
                                        {isGM && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm('Delete this range?')) {
                                                        removeAgencyOverride(hotelId, agency.id, override.id)
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="py-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {ROOM_TYPES.map(room => (
                                            <div key={room} className="space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                                                    {t(`room.${room}`)}
                                                </div>
                                                <div className="text-sm font-mono font-bold flex items-center">
                                                    {override.prices[room]?.currency === 'USD' ? <DollarSign className="w-3 h-3" /> : <EuroIcon className="w-3 h-3" />}
                                                    {override.prices[room]?.amount || '---'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                )}
            </div>
        </div>
    )
}

function OverrideEditor({ onSave, onCancel }: { onSave: (o: AgencyOverride) => Promise<void>, onCancel: () => void }) {
    const { t } = useLanguageStore()
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(addDaysFns(new Date(), 7), 'yyyy-MM-dd'))
    const [prices, setPrices] = useState<Record<string, RoomPriceEntry>>({})
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!startDate || !endDate) return
        setIsSaving(true)
        try {
            await onSave({
                id: `override_${Date.now()}`,
                start_date: startDate,
                end_date: endDate,
                prices
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('pricing.lookup.date')} (Start)</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('pricing.lookup.date')} (End)</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROOM_TYPES.map(room => (
                    <div key={room} className="space-y-2 p-3 rounded-xl bg-background/50 border border-border/50">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block">{t(`room.${room}`)}</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                className="h-8 text-right font-mono"
                                value={prices[room]?.amount || 0}
                                onChange={e => setPrices(p => ({ ...p, [room]: { ...(p[room] || { currency: 'EUR' }), amount: parseFloat(e.target.value) || 0 } }))}
                            />
                            <Select
                                value={prices[room]?.currency || 'EUR'}
                                onValueChange={val => setPrices(p => ({ ...p, [room]: { ...(p[room] || { amount: 0 }), currency: val as PricingCurrency } }))}
                            >
                                <SelectTrigger className="h-8 w-16 px-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Override
                </Button>
            </div>
        </div>
    )
}

function AddAgencyDialog({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
    const { t } = useLanguageStore()
    const [name, setName] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <Button size="sm" onClick={() => setIsOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('pricing.agencies.add')}
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder={t('pricing.agencies.placeholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-8 w-48 text-xs"
                autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={async () => {
                if (name) {
                    await onAdd(name)
                    setName('')
                    setIsOpen(false)
                }
            }}>Add</Button>
        </div>
    )
}
