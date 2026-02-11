import { useState, useEffect } from 'react'
import { format, addDays as addDaysFns } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
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
    Zap,
    Users,
    Sparkles,
    ArrowUpDown,
    Table,
    List
} from 'lucide-react'
import { usePricingStore } from '@/stores/pricingStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn, formatDisplayDate } from '@/lib/utils'
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

    const [activeTab, setActiveTab] = useState<'generic' | 'special'>('generic')
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

    // Normal users only see price lookup
    if (!isGM) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <PriceLookup />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Top Tab Switcher */}
            <div className="flex justify-center">
                <div className="bg-background/40 backdrop-blur-xl border border-border/50 p-1 rounded-2xl flex gap-1 shadow-2xl">
                    <Button
                        variant={activeTab === 'generic' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab('generic')}
                        className={cn(
                            "rounded-xl px-6 py-2 h-auto gap-2 transition-all duration-300",
                            activeTab === 'generic' ? "shadow-lg bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Table className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-sm font-bold">Standard Rates</span>
                            <span className="text-[10px] opacity-70">Generic Prices</span>
                        </div>
                    </Button>
                    <Button
                        variant={activeTab === 'special' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab('special')}
                        className={cn(
                            "rounded-xl px-6 py-2 h-auto gap-2 transition-all duration-300",
                            activeTab === 'special' ? "shadow-lg bg-amber-500 text-white hover:bg-amber-600" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Zap className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-sm font-bold">Special Periods</span>
                            <span className="text-[10px] opacity-70">Overrides & AI</span>
                        </div>
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'generic' ? (
                    <motion.div
                        key="generic"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <GenericAgencyPricingTable
                            agencies={agencies}
                            isGM={isGM}
                            hotelId={hotelId}
                            onAddAgency={async (name) => {
                                if (hotelId) await addAgency(hotelId, name)
                            }}
                            onRemoveAgency={async (agencyId) => {
                                if (hotelId) await removeAgency(hotelId, agencyId)
                            }}
                        />
                        <PriceLookup />
                    </motion.div>
                ) : (
                    <motion.div
                        key="special"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Special Periods Content */}
                        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                            {isGM ? <BulkRateEditor hotelId={hotelId!} /> : <PriceLookup />}
                        </div>

                        {/* AI Agent Section (GM Only) */}
                        {isGM && (
                            <AIPricingAgent hotelId={hotelId!} />
                        )}

                        {/* Global Overrides (Everyone) */}
                        <GlobalOverrideManager
                            baseOverrides={baseOverrides}
                            isGM={isGM}
                            hotelId={hotelId!}
                        />

                        {/* Agencies Section */}
                        <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="border-b border-border/50 bg-muted/30 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Building2 className="w-6 h-6 text-primary" />
                                            {t('pricing.agencies.title')}
                                        </CardTitle>
                                        <CardDescription>{t('pricing.agencies.desc')}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
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
                                                className="gap-2 rounded-xl group/back hover:bg-primary/10"
                                            >
                                                <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                                                Back to list
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 relative z-10">
                                {selectedAgencyId ? (
                                    <AgencyOverrideManager
                                        agency={selectedAgency!}
                                        isGM={isGM}
                                        hotelId={hotelId}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                        {agencies.map((agency) => (
                                            <motion.div
                                                key={agency.id}
                                                whileHover={{ y: -5 }}
                                                className="cursor-pointer"
                                                onClick={() => setSelectedAgencyId(agency.id)}
                                            >
                                                <Card className="border-border/50 bg-muted/20 hover:bg-muted/40 transition-all border-l-4 border-l-primary group/agency overflow-hidden relative">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                                    <CardHeader className="py-4">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <Building2 className="w-4 h-4 text-primary" />
                                                                {agency.name}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2">
                                                                {isGM && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive opacity-0 group-hover/agency:opacity-100 transition-opacity hover:bg-destructive/10"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            if (confirm(`Delete ${agency.name}?`)) {
                                                                                removeAgency(hotelId, agency.id)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover/agency:text-primary transition-colors" />
                                                            </div>
                                                        </div>
                                                        <CardDescription className="flex items-center gap-2">
                                                            <Zap className="w-3 h-3 text-amber-500" />
                                                            {agency.overrides.length} Special Periods
                                                        </CardDescription>
                                                    </CardHeader>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
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
            const lines = input.split('\n').filter(l => l.trim())
            for (const line of lines) {
                let parts = line.split('|').map(p => p.trim())
                if (parts.length < 3 && line.includes('\t')) {
                    parts = line.split('\t').map(p => p.trim())
                }

                if (parts.length < 3) continue

                const datePart = parts[0]
                const targetPart = parts[1]
                const pricePart = parts[2]

                // Robust Date Parsing
                const rawDates = datePart.split(/to|\s-\s/).map(d => d.trim())
                const normalizeDate = (d: string) => {
                    // Try YYYY-MM-DD
                    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d

                    const now = new Date()
                    const year = now.getFullYear()

                    // Try DD.MMM (e.g. 1.Jan)
                    const dotMonthMatch = d.match(/^(\d{1,2})\.([A-Za-z]+)$/)
                    if (dotMonthMatch) {
                        const day = dotMonthMatch[1].padStart(2, '0')
                        const monthStr = dotMonthMatch[2].toLowerCase()
                        const monthMap: Record<string, string> = {
                            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
                        }
                        const month = monthMap[monthStr.substring(0, 3)]
                        if (month) return `${year}-${month}-${day}`
                    }

                    // Fallback to JS Date parsing if possible
                    const parsed = new Date(d)
                    if (!isNaN(parsed.getTime())) {
                        return format(parsed, 'yyyy-MM-dd')
                    }
                    return null
                }

                const startDateStr = normalizeDate(rawDates[0])
                const endDateStr = normalizeDate(rawDates[1] || rawDates[0])

                if (!startDateStr || !endDateStr) {
                    console.warn(`Could not parse dates: ${datePart}`)
                    continue
                }

                const prices: Record<string, RoomPriceEntry> = {}
                pricePart.split(',').forEach(p => {
                    const colonIndex = p.indexOf(':')
                    if (colonIndex === -1) return

                    const roomRaw = p.substring(0, colonIndex).trim().toLowerCase()
                    const valRaw = p.substring(colonIndex + 1).trim()

                    // Handle European decimals and currencies
                    const cleanVal = valRaw.replace(',', '.').replace(/[^0-9.]/g, '')
                    const amount = parseFloat(cleanVal)

                    if (roomRaw && !isNaN(amount)) {
                        // Priority room matching (long strings first to avoid "Corner" matching "Corner Suite")
                        const sortedRoomTypes = [...ROOM_TYPES].sort((a, b) => b.length - a.length)
                        let matchedRoom = sortedRoomTypes.find(r => roomRaw.includes(r.replace('_', ' ')) || roomRaw.includes(r))

                        // Alias matching
                        if (!matchedRoom) {
                            if (roomRaw.includes('terrace')) matchedRoom = 'teras_suite'
                            if (roomRaw.includes('jacuzzi')) matchedRoom = 'corner_jacuzzi'
                        }

                        if (matchedRoom) {
                            prices[matchedRoom] = { amount, currency: 'EUR' }
                        }
                    }
                })

                if (Object.keys(prices).length > 0) {
                    const override = {
                        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        start_date: startDateStr,
                        end_date: endDateStr,
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
        <Card className="border-primary/20 bg-primary/5 backdrop-blur-2xl border-dashed group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-2 relative z-10">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary animate-pulse" />
                        {t('pricing.bulk.title') || 'Bulk Rate Editor'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {t('pricing.bulk.desc') || 'Apply prices to a date range for everyone or an agency'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('pricing.lookup.agency')}</label>
                        <Select value={target} onValueChange={setTarget}>
                            <SelectTrigger className="h-10 bg-background/80 border-border/50 rounded-xl">
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
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('pricing.date.start')}</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 bg-background/80 border-border/50 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('pricing.date.end')}</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 bg-background/80 border-border/50 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {ROOM_TYPES.map((room, idx) => (
                        <motion.div
                            key={room}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-3 rounded-2xl bg-background/40 border border-border/50 hover:border-primary/30 transition-all duration-300"
                        >
                            <label className="text-[10px] font-bold block mb-2 truncate capitalize text-muted-foreground">{t(`room.${room}`)}</label>
                            <div className="flex gap-1.5">
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-xs text-right font-mono px-2 bg-background/60 border-border/40 rounded-lg"
                                    placeholder="0"
                                    value={prices[room]?.amount || ''}
                                    onChange={e => setPrices(p => ({ ...p, [room]: { ...(p[room] || { currency: 'EUR' }), amount: parseFloat(e.target.value) || 0 } }))}
                                />
                                <Select
                                    value={prices[room]?.currency || 'EUR'}
                                    onValueChange={val => setPrices(p => ({ ...p, [room]: { ...(p[room] || { amount: 0 }), currency: val as PricingCurrency } }))}
                                >
                                    <SelectTrigger className="h-9 w-14 px-1 text-[10px] bg-background/60 border-border/40 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <Button className="w-full h-10 gap-2 rounded-xl bg-primary hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" size="sm" onClick={handleApply} disabled={isSaving}>
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
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [viewMode, setViewMode] = useState<'list' | 'table'>('list')

    const sortedOverrides = [...baseOverrides].sort((a, b) => {
        return sortOrder === 'desc'
            ? b.start_date.localeCompare(a.start_date)
            : a.start_date.localeCompare(b.start_date)
    })

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <CardHeader className="py-4 border-b border-border/30 bg-muted/20 relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-amber-500" />
                            {t('pricing.global_overrides.title') || 'Special Periods (Everyone)'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {t('pricing.global_overrides.desc') || 'Prices defined here apply to all agencies during the specified dates.'}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-background/50 rounded-lg p-0.5 border border-border/30 mr-2">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                onClick={() => setViewMode('list')}
                                title="List View"
                            >
                                <List className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <Table className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="h-8 gap-2 text-xs font-medium"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
                <div className="divide-y divide-border/30">
                    {sortedOverrides.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm italic">
                            No global overrides defined.
                        </div>
                    ) : viewMode === 'list' ? (
                        <AnimatePresence initial={false}>
                            {sortedOverrides.map((override, idx) => (
                                <motion.div
                                    key={override.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 flex items-center justify-between group/item hover:bg-primary/5 transition-all duration-300"
                                >
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="px-2 py-1 rounded-md bg-primary/10 flex items-center gap-2 font-mono text-xs font-bold text-primary">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDisplayDate(override.start_date)}
                                            </div>
                                            <span className="text-muted-foreground">→</span>
                                            <div className="px-2 py-1 rounded-md bg-primary/10 flex items-center gap-2 font-mono text-xs font-bold text-primary">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDisplayDate(override.end_date)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                            {ROOM_TYPES.map(room => (
                                                <div key={room} className="text-[10px] p-1.5 rounded-lg bg-background/40 border border-border/20 flex flex-col gap-0.5">
                                                    <span className="text-muted-foreground capitalize truncate">{t(`room.${room}`)}</span>
                                                    <span className="font-bold text-foreground flex items-center gap-0.5">
                                                        <span className="opacity-50 text-[8px] font-normal">{override.prices[room]?.currency || 'EUR'}</span>
                                                        {override.prices[room]?.amount?.toFixed(2) || '---'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {isGM && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 h-8 w-8 ml-4 shrink-0"
                                            onClick={() => {
                                                if (confirm('Delete this global override?')) {
                                                    removeBaseOverride(hotelId, override.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30">
                                    <tr>
                                        <th className="p-3 pl-4">Dates</th>
                                        {ROOM_TYPES.map(room => (
                                            <th key={room} className="p-3 text-center capitalize">{t(`room.${room}`)}</th>
                                        ))}
                                        {isGM && <th className="p-3 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    <AnimatePresence initial={false}>
                                        {sortedOverrides.map((override) => (
                                            <motion.tr
                                                key={override.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-primary/5 transition-colors group/row"
                                            >
                                                <td className="p-3 pl-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 font-mono font-bold text-primary">
                                                        {formatDisplayDate(override.start_date)}
                                                        <span className="mx-1 text-muted-foreground font-light">→</span>
                                                        {formatDisplayDate(override.end_date)}
                                                    </div>
                                                </td>
                                                {ROOM_TYPES.map(room => (
                                                    <td key={room} className="p-3 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-mono font-bold">
                                                                {override.prices[room]?.amount?.toFixed(2) || '---'}
                                                            </span>
                                                            <span className="text-[8px] opacity-40 uppercase">
                                                                {override.prices[room]?.currency || 'EUR'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                ))}
                                                {isGM && (
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-row:hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                if (confirm('Delete this global override?')) {
                                                                    removeBaseOverride(hotelId, override.id)
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative z-10 border-b border-border/30 bg-muted/20">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        {t('pricing.lookup.title')}
                    </CardTitle>
                    <CardDescription>{t('pricing.lookup.desc')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('pricing.lookup.date')}</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-background/80 border-border/50 rounded-xl h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('pricing.lookup.agency')}</label>
                        <Select value={agencyId} onValueChange={setAgencyId}>
                            <SelectTrigger className="bg-background/80 border-border/50 rounded-xl h-10">
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

                <div className="divide-y divide-border/20 rounded-[2rem] border border-border/30 bg-muted/30 overflow-hidden shadow-inner relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    {ROOM_TYPES.map((room, idx) => {
                        const price = getEffectivePrice(date, room, agencyId === 'base' ? undefined : agencyId)
                        const isOverride = agencyId !== 'base' && price !== getEffectivePrice(date, room)

                        return (
                            <motion.div
                                key={room}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="flex justify-between items-center p-5 group/item hover:bg-primary/5 transition-all duration-300 relative"
                            >
                                <div className="space-y-2">
                                    <div className="text-sm font-bold capitalize flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/item:scale-150 transition-transform" />
                                        {t(`room.${room}`)}
                                    </div>
                                    <div className={cn(
                                        "text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
                                        isOverride ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20" : "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                                    )}>
                                        {isOverride ? (
                                            <><Sparkles className="w-2.5 h-2.5" /> {t('pricing.lookup.overrideUsed')}</>
                                        ) : (
                                            <><CheckCircle2 className="w-2.5 h-2.5" /> {t('pricing.lookup.basePriceUsed')}</>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div className="space-y-1">
                                        <div className="text-2xl font-black font-mono tracking-tighter flex items-center justify-end text-foreground group-hover/item:text-primary transition-colors">
                                            <span className="text-xs font-medium text-muted-foreground mr-1 self-start mt-1.5">{price?.currency || 'EUR'}</span>
                                            {price?.amount?.toFixed(2) || '---'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('pricing.perNight')}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover/item:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
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
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [viewMode, setViewMode] = useState<'list' | 'table'>('list')

    const sortedOverrides = [...agency.overrides].sort((a, b) => {
        return sortOrder === 'desc'
            ? b.start_date.localeCompare(a.start_date)
            : a.start_date.localeCompare(b.start_date)
    })

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 group">
                        <Building2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        {agency.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t('pricing.overrides.title')} ({viewMode === 'list' ? 'Card' : 'Table'} View)</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-background/50 rounded-lg p-0.5 border border-border/30 mr-2">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <Table className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="h-8 gap-2 text-xs font-medium border-border/50"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </Button>
                    {isGM && !isAdding && (
                        <Button size="sm" onClick={() => setIsAdding(true)} className="gap-2 h-8">
                            <Plus className="w-4 h-4" />
                            {t('pricing.overrides.add')}
                        </Button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border border-primary/30 bg-primary/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        <OverrideEditor
                            onSave={async (override) => {
                                await setAgencyOverride(hotelId, agency.id, override)
                                setIsAdding(false)
                            }}
                            onCancel={() => setIsAdding(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {agency.overrides.length === 0 && !isAdding ? (
                    <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed border-border/30 rounded-3xl bg-muted/5">
                        <Sparkles className="w-8 h-8 mx-auto mb-4 opacity-20" />
                        {t('pricing.overrides.empty')}
                    </div>
                ) : viewMode === 'list' ? (
                    sortedOverrides.map((override, idx) => (
                        <motion.div
                            key={override.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="border-border/50 bg-background/40 hover:bg-background/60 transition-all duration-300 group/card overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                                <CardHeader className="py-3 bg-muted/20 border-b border-border/30 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="px-2 py-1 rounded-lg bg-primary/10 flex items-center gap-2 font-mono text-xs font-bold text-primary">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDisplayDate(override.start_date)}
                                            </div>
                                            <span className="text-muted-foreground font-light shrink-0">→</span>
                                            <div className="px-2 py-1 rounded-lg bg-primary/10 flex items-center gap-2 font-mono text-xs font-bold text-primary">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDisplayDate(override.end_date)}
                                            </div>
                                        </div>
                                        {isGM && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive opacity-0 group-hover/card:opacity-100 transition-all hover:bg-destructive/10 hover:scale-110"
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
                                <CardContent className="py-4 relative z-10">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {ROOM_TYPES.map(room => (
                                            <div key={room} className="p-2 rounded-xl bg-muted/10 border border-border/10 group/price hover:border-primary/30 transition-colors">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider truncate">
                                                    {t(`room.${room}`)}
                                                </div>
                                                <div className="text-sm font-mono font-bold flex items-center gap-1 group-hover/price:text-primary transition-colors">
                                                    <span className="opacity-50 text-[10px] font-normal">{override.prices[room]?.currency || 'EUR'}</span>
                                                    {override.prices[room]?.amount?.toFixed(2) || '---'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="border border-border/30 rounded-2xl bg-background/40 backdrop-blur-md overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30">
                                    <tr>
                                        <th className="p-3 pl-6">Date Range</th>
                                        {ROOM_TYPES.map(room => (
                                            <th key={room} className="p-3 text-center capitalize min-w-[100px]">{t(`room.${room}`)}</th>
                                        ))}
                                        {isGM && <th className="p-3 text-right pr-6">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    <AnimatePresence initial={false}>
                                        {sortedOverrides.map((override) => (
                                            <motion.tr
                                                key={override.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-primary/5 transition-colors group/row"
                                            >
                                                <td className="p-3 pl-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 font-mono font-bold text-primary">
                                                        <Calendar className="w-3 h-3 opacity-50" />
                                                        {formatDisplayDate(override.start_date)}
                                                        <span className="mx-1 text-muted-foreground font-light">→</span>
                                                        {formatDisplayDate(override.end_date)}
                                                    </div>
                                                </td>
                                                {ROOM_TYPES.map(room => (
                                                    <td key={room} className="p-3 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-mono font-bold group-hover/row:text-primary transition-colors">
                                                                {override.prices[room]?.amount?.toFixed(2) || '---'}
                                                            </span>
                                                            <span className="text-[8px] opacity-40 uppercase font-medium">
                                                                {override.prices[room]?.currency || 'EUR'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                ))}
                                                {isGM && (
                                                    <td className="p-3 text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover/row:opacity-100 transition-all hover:scale-110"
                                                            onClick={() => {
                                                                if (confirm('Delete this range?')) {
                                                                    removeAgencyOverride(hotelId, agency.id, override.id)
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function GenericAgencyPricingTable({ agencies, isGM, hotelId, onAddAgency, onRemoveAgency }: {
    agencies: Agency[], isGM: boolean, hotelId: string,
    onAddAgency: (name: string) => Promise<void>,
    onRemoveAgency: (agencyId: string) => Promise<void>
}) {
    const { t } = useLanguageStore()
    const { basePrices, setBasePrices, updateAgencyBasePrices } = usePricingStore()
    const { user } = useAuthStore()
    const [editingId, setEditingId] = useState<string | null>(null) // 'global' or agency id
    const [editPrices, setEditPrices] = useState<Record<string, RoomPriceEntry>>({})
    const [isSaving, setIsSaving] = useState(false)

    const startEditing = (id: string, prices: Record<string, RoomPriceEntry>) => {
        setEditingId(id)
        setEditPrices({ ...prices })
    }

    const saveChanges = async () => {
        if (!editingId) return
        setIsSaving(true)
        try {
            if (editingId === 'global') {
                await setBasePrices(hotelId, editPrices, user?.uid || '')
            } else {
                await updateAgencyBasePrices(hotelId, editingId, editPrices)
            }
            setEditingId(null)
        } finally {
            setIsSaving(false)
        }
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditPrices({})
    }

    const globalPrices = (basePrices?.prices || {}) as Record<string, RoomPriceEntry>

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            <CardHeader className="py-4 border-b border-border/30 bg-muted/20 relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            {t('pricing.base.title')}
                        </CardTitle>
                        <CardDescription>Genel ve acenta bazlı standart oda fiyatları</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {isGM && (
                            <AddAgencyDialog onAdd={onAddAgency} />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30">
                            <tr>
                                <th className="p-3 pl-6 min-w-[160px]">Kaynak</th>
                                {ROOM_TYPES.map(room => (
                                    <th key={room} className="p-3 text-center capitalize min-w-[100px]">{t(`room.${room}`)}</th>
                                ))}
                                {isGM && <th className="p-3 text-right pr-6 min-w-[100px]">İşlem</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {/* ===== GENEL (HERKES) ROW ===== */}
                            <motion.tr
                                className={cn(
                                    "transition-colors group/row",
                                    editingId === 'global' ? "bg-primary/10" : "bg-primary/5 hover:bg-primary/10"
                                )}
                            >
                                <td className="p-3 pl-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/20">
                                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-foreground">Genel</div>
                                            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Herkes</div>
                                        </div>
                                    </div>
                                </td>
                                {ROOM_TYPES.map(room => (
                                    <td key={room} className="p-3 text-center">
                                        {editingId === 'global' ? (
                                            <Input
                                                type="number"
                                                className="h-8 w-20 text-center text-xs px-1 font-mono mx-auto"
                                                value={editPrices[room]?.amount || 0}
                                                step="0.01"
                                                onChange={e => setEditPrices(prev => ({
                                                    ...prev,
                                                    [room]: { amount: parseFloat(e.target.value) || 0, currency: prev[room]?.currency || 'EUR' }
                                                }))}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                                    {globalPrices[room]?.amount?.toFixed(2) || '---'}
                                                </span>
                                                <span className="text-[8px] opacity-40 uppercase">
                                                    {globalPrices[room]?.currency || 'EUR'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                ))}
                                {isGM && (
                                    <td className="p-3 text-right pr-6">
                                        {editingId === 'global' ? (
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={cancelEditing}>
                                                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Button>
                                                <Button variant="secondary" size="icon" className="h-7 w-7 bg-emerald-500/10 hover:bg-emerald-500/20" onClick={saveChanges} disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-500" />}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost" size="sm"
                                                className="h-7 text-[10px] font-bold uppercase tracking-tighter opacity-0 group-hover/row:opacity-100 transition-opacity bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                onClick={() => startEditing('global', globalPrices)}
                                            >
                                                Düzenle
                                            </Button>
                                        )}
                                    </td>
                                )}
                            </motion.tr>

                            {/* ===== AGENCY ROWS ===== */}
                            {agencies.map((agency) => (
                                <motion.tr
                                    key={agency.id}
                                    className={cn(
                                        "transition-colors group/row",
                                        editingId === agency.id ? "bg-primary/10" : "hover:bg-primary/5"
                                    )}
                                >
                                    <td className="p-3 pl-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-foreground">{agency.name}</div>
                                                <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Özel Fiyat</div>
                                            </div>
                                        </div>
                                    </td>
                                    {ROOM_TYPES.map(room => {
                                        const agencyPrice = agency.base_prices?.[room]
                                        const inheritsGlobal = !agencyPrice
                                        return (
                                            <td key={room} className="p-3 text-center">
                                                {editingId === agency.id ? (
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-20 text-center text-xs px-1 font-mono mx-auto"
                                                        value={editPrices[room]?.amount || 0}
                                                        step="0.01"
                                                        placeholder={globalPrices[room]?.amount?.toFixed(2) || '0'}
                                                        onChange={e => setEditPrices(prev => ({
                                                            ...prev,
                                                            [room]: { amount: parseFloat(e.target.value) || 0, currency: prev[room]?.currency || globalPrices[room]?.currency || 'EUR' }
                                                        }))}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn(
                                                            "font-mono font-bold text-sm",
                                                            inheritsGlobal ? "text-muted-foreground/40 italic" : "text-primary/80 group-hover/row:text-primary"
                                                        )}>
                                                            {inheritsGlobal
                                                                ? (globalPrices[room]?.amount?.toFixed(2) || '---')
                                                                : agencyPrice.amount.toFixed(2)
                                                            }
                                                        </span>
                                                        <span className="text-[8px] opacity-40 uppercase">
                                                            {inheritsGlobal
                                                                ? (globalPrices[room]?.currency || 'EUR')
                                                                : agencyPrice.currency
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}
                                    {isGM && (
                                        <td className="p-3 text-right pr-6">
                                            {editingId === agency.id ? (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={cancelEditing}>
                                                        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-7 w-7 bg-emerald-500/10 hover:bg-emerald-500/20" onClick={saveChanges} disabled={isSaving}>
                                                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-500" />}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="h-7 text-[10px] font-bold uppercase tracking-tighter bg-primary/5 hover:bg-primary/10"
                                                        onClick={() => startEditing(agency.id, agency.base_prices || {})}
                                                    >
                                                        Düzenle
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (confirm(`${agency.name} silinsin mi?`)) {
                                                                onRemoveAgency(agency.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </motion.tr>
                            ))}

                            {/* Empty state */}
                            {agencies.length === 0 && (
                                <tr>
                                    <td colSpan={ROOM_TYPES.length + 2} className="p-6 text-center text-muted-foreground/60 text-xs italic">
                                        Henüz özel fiyat tanımlı acenta yok. Yukarıdan acenta ekleyebilirsiniz.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
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
