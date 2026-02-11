import { useState, useEffect } from 'react'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import { Save, Loader2, CalendarRange, Calendar, Users, Building2, Plus, X } from 'lucide-react'
import { usePriceStore } from '@/stores/priceStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { RoomType, Currency } from '@/types'

const CURRENCIES: Currency[] = ['EUR', 'USD', 'TRY', 'GBP']

type PriceState = {
    amount: string;
    currency: Currency
}

export function PriceManager() {
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()
    const { prices, loadPrices, setPrice, loading } = usePriceStore()
    const { t } = useLanguageStore()

    const ROOM_TYPES: { id: RoomType; label: string }[] = [
        { id: 'standard', label: t('room.standard') },
        { id: 'corner', label: t('room.corner') },
        { id: 'corner_jacuzzi', label: t('room.corner_jacuzzi') },
        { id: 'triple', label: t('room.triple') },
        { id: 'teras_suite', label: t('room.teras_suite') },
    ]

    // Mode: Single Date vs Range
    const [isRangeMode, setIsRangeMode] = useState(false)

    // Date States
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'))

    const [savingStandard, setSavingStandard] = useState(false)
    const [savingAgency, setSavingAgency] = useState(false)
    const [newAgencyName, setNewAgencyName] = useState('')

    const { updateHotelSettings } = useHotelStore()

    // === Section 1: Standard Prices only ===
    const [standardPrices, setStandardPrices] = useState<Record<string, PriceState>>({})

    // === Section 2: Agency Pricing ===
    // "base" = default special group price, or a specific agency name
    const [selectedAgency, setSelectedAgency] = useState<string>('base')
    const [agencyPrices, setAgencyPrices] = useState<Record<string, PriceState>>({})

    // Load prices for start date
    useEffect(() => {
        if (hotel?.id) {
            loadPrices(hotel.id, startDate, startDate)
        }
    }, [hotel?.id, startDate, loadPrices])

    // Populate standard prices from store
    useEffect(() => {
        const dayPrices = prices[startDate]
        const newStandardPrices: Record<string, PriceState> = {}

        ROOM_TYPES.forEach(room => {
            const priceData = dayPrices?.prices?.[room.id]
            newStandardPrices[room.id] = {
                amount: priceData?.standard?.amount?.toString() || '',
                currency: priceData?.standard?.currency || 'EUR'
            }
        })

        setStandardPrices(newStandardPrices)
    }, [prices, startDate]) // eslint-disable-line react-hooks/exhaustive-deps

    // Populate agency prices based on selection
    useEffect(() => {
        const dayPrices = prices[startDate]
        const newAgencyPrices: Record<string, PriceState> = {}

        ROOM_TYPES.forEach(room => {
            const priceData = dayPrices?.prices?.[room.id]

            if (selectedAgency === 'base') {
                // Show base special group prices
                newAgencyPrices[room.id] = {
                    amount: priceData?.special_group?.amount?.toString() || '',
                    currency: priceData?.special_group?.currency || 'EUR'
                }
            } else {
                // Show specific agency prices
                const agencyPrice = priceData?.agency_prices?.[selectedAgency]
                newAgencyPrices[room.id] = {
                    amount: agencyPrice?.amount?.toString() || '',
                    currency: agencyPrice?.currency || 'EUR'
                }
            }
        })

        setAgencyPrices(newAgencyPrices)
    }, [prices, startDate, selectedAgency]) // eslint-disable-line react-hooks/exhaustive-deps

    // === Handlers ===

    const handleStandardInputChange = (roomId: string, field: 'amount' | 'currency', value: string) => {
        setStandardPrices(prev => ({
            ...prev,
            [roomId]: { ...prev[roomId], [field]: value }
        }))
    }

    const handleAgencyInputChange = (roomId: string, field: 'amount' | 'currency', value: string) => {
        setAgencyPrices(prev => ({
            ...prev,
            [roomId]: { ...prev[roomId], [field]: value }
        }))
    }

    const handleAddAgency = async () => {
        if (!hotel?.id || !newAgencyName.trim()) return

        const currentAgencies = hotel.settings.special_group_agencies || []
        if (currentAgencies.includes(newAgencyName.trim())) return

        const updatedAgencies = [...currentAgencies, newAgencyName.trim()]

        try {
            await updateHotelSettings(hotel.id, { special_group_agencies: updatedAgencies })
            setNewAgencyName('')
        } catch (error) {
            console.error("Failed to add agency", error)
        }
    }

    const handleRemoveAgency = async (agency: string) => {
        if (!hotel?.id) return

        const currentAgencies = hotel.settings.special_group_agencies || []
        const updatedAgencies = currentAgencies.filter(a => a !== agency)
        if (selectedAgency === agency) setSelectedAgency('base')

        try {
            await updateHotelSettings(hotel.id, { special_group_agencies: updatedAgencies })
        } catch (error) {
            console.error("Failed to remove agency", error)
        }
    }

    const getDaysToSave = (): string[] | null => {
        const daysToSave: string[] = []
        if (isRangeMode) {
            const start = parseISO(startDate)
            const end = parseISO(endDate)
            const diff = differenceInDays(end, start)
            if (diff < 0) {
                alert("End date must be after start date.")
                return null
            }
            for (let i = 0; i <= diff; i++) {
                daysToSave.push(format(addDays(start, i), 'yyyy-MM-dd'))
            }
        } else {
            daysToSave.push(startDate)
        }
        return daysToSave
    }

    // Save ONLY standard prices
    const handleSaveStandard = async () => {
        if (!hotel?.id || !user?.uid) return
        setSavingStandard(true)

        try {
            const daysToSave = getDaysToSave()
            if (!daysToSave) { setSavingStandard(false); return }

            const promises = []
            for (const dateKey of daysToSave) {
                for (const room of ROOM_TYPES) {
                    const values = standardPrices[room.id]
                    if (!values || (!values.amount && values.amount !== '0')) continue
                    const amount = parseFloat(values.amount) || 0
                    promises.push(setPrice(hotel.id, dateKey, room.id, 'standard', amount, values.currency, user.uid))
                }
            }

            await Promise.all(promises)
            alert(`Standard prices for ${isRangeMode ? `${daysToSave.length} days` : startDate} saved.`)
        } catch (error) {
            console.error(error)
            alert("Failed to save prices.")
        } finally {
            setSavingStandard(false)
        }
    }

    // Save ONLY agency prices (base or specific agency)
    const handleSaveAgency = async () => {
        if (!hotel?.id || !user?.uid) return
        setSavingAgency(true)

        try {
            const daysToSave = getDaysToSave()
            if (!daysToSave) { setSavingAgency(false); return }

            const promises = []
            for (const dateKey of daysToSave) {
                for (const room of ROOM_TYPES) {
                    const values = agencyPrices[room.id]
                    if (!values || (!values.amount && values.amount !== '0')) continue
                    const amount = parseFloat(values.amount) || 0

                    if (selectedAgency === 'base') {
                        // Save as base special group price
                        promises.push(setPrice(hotel.id, dateKey, room.id, 'special_group', amount, values.currency, user.uid))
                    } else {
                        // Save as agency-specific price
                        promises.push(setPrice(hotel.id, dateKey, room.id, 'special_group', amount, values.currency, user.uid, selectedAgency))
                    }
                }
            }

            await Promise.all(promises)
            const label = selectedAgency === 'base' ? 'Base agency' : selectedAgency
            alert(`${label} prices for ${isRangeMode ? `${daysToSave.length} days` : startDate} saved.`)
        } catch (error) {
            console.error(error)
            alert("Failed to save agency prices.")
        } finally {
            setSavingAgency(false)
        }
    }

    // Get base special group price for reference in agency-specific view
    const getBaseSpecialPrice = (roomId: RoomType): string => {
        const dayPrices = prices[startDate]
        const priceData = dayPrices?.prices?.[roomId]
        return priceData?.special_group?.amount?.toString() || '—'
    }

    const getBaseSpecialCurrency = (roomId: RoomType): string => {
        const dayPrices = prices[startDate]
        const priceData = dayPrices?.prices?.[roomId]
        return priceData?.special_group?.currency || ''
    }

    const agencies = hotel?.settings?.special_group_agencies || []
    const isSpecificAgency = selectedAgency !== 'base'

    return (
        <Card className="w-full max-w-4xl mx-auto border-border bg-card/50 backdrop-blur-xl shadow-lg">
            <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-6">
                <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-foreground">{t('pricing.manager.title')}</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {t('pricing.manager.desc')}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
                        <Button
                            variant={!isRangeMode ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setIsRangeMode(false)}
                            className="text-xs"
                        >
                            <Calendar className="w-3.5 h-3.5 mr-2" />
                            {t('pricing.mode.single')}
                        </Button>
                        <Button
                            variant={isRangeMode ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setIsRangeMode(true)}
                            className="text-xs"
                        >
                            <CalendarRange className="w-3.5 h-3.5 mr-2" />
                            {t('pricing.mode.range')}
                        </Button>
                    </div>
                </div>

                {/* Date Selector Row */}
                <div className="flex items-end gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {isRangeMode ? t('pricing.date.start') : t('pricing.date.selected')}
                        </Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-[180px] bg-background border-input text-foreground font-mono"
                        />
                    </div>

                    {isRangeMode && (
                        <>
                            <div className="pb-2 text-muted-foreground">→</div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('pricing.date.end')}
                                </Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="w-[180px] bg-background border-input text-foreground font-mono"
                                />
                            </div>
                            <div className="pb-2 text-xs text-muted-foreground font-medium">
                                ({differenceInDays(parseISO(endDate), parseISO(startDate)) + 1} {t('pricing.days')})
                            </div>
                        </>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-8">

                {/* ═══════════════════════════════════════════
                    SECTION 1: STANDARD PRICES ONLY
                ═══════════════════════════════════════════ */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                            <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Standard Prices</h3>
                            <p className="text-xs text-muted-foreground">Public rack rates for walk-in guests</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden bg-background">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground font-medium">
                                <tr className="border-b border-border">
                                    <th className="px-4 py-3 w-[200px]">{t('pricing.table.roomType')}</th>
                                    <th className="px-4 py-3">{t('pricing.table.standard')}</th>
                                    {isRangeMode && <th className="px-4 py-3 w-1"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {ROOM_TYPES.map((room) => (
                                    <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{room.label}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="number"
                                                    value={standardPrices[room.id]?.amount || ''}
                                                    onChange={(e) => handleStandardInputChange(room.id, 'amount', e.target.value)}
                                                    className="flex-1 min-w-[100px] bg-background border-input text-foreground"
                                                    placeholder="0.00"
                                                />
                                                <Select
                                                    value={standardPrices[room.id]?.currency || 'EUR'}
                                                    onValueChange={(v) => handleStandardInputChange(room.id, 'currency', v)}
                                                >
                                                    <SelectTrigger className="w-[85px] bg-background border-input h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CURRENCIES.map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                        {isRangeMode && (
                                            <td className="px-4 py-3 text-xs text-muted-foreground w-1 whitespace-nowrap">
                                                {t('pricing.table.allDays')}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveStandard}
                            disabled={savingStandard || loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]"
                        >
                            {savingStandard ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.save')}...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" />Save Standard</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    SECTION 2: AGENCY PRICING (completely independent)
                ═══════════════════════════════════════════ */}
                <div className="space-y-4 border-t border-border/50 pt-8">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Users className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Agency Pricing</h3>
                            <p className="text-xs text-muted-foreground">Set base agency rates or override per specific agency</p>
                        </div>
                    </div>

                    {/* Agency Selector */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Select Pricing Target
                        </Label>
                        <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                            <SelectTrigger className="w-full max-w-sm bg-background border-emerald-500/30 text-foreground font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="base">
                                    Base Agency Rate (default for all)
                                </SelectItem>
                                {agencies.map((agency) => (
                                    <SelectItem key={agency} value={agency}>
                                        {agency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Agency Price Table */}
                    <div className="rounded-lg border border-emerald-500/20 overflow-hidden bg-background">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-emerald-500/5 text-muted-foreground font-medium">
                                <tr className="border-b border-emerald-500/20">
                                    <th className="px-4 py-3 w-[200px]">{t('pricing.table.roomType')}</th>
                                    <th className="px-4 py-3">
                                        <span className="flex items-center gap-2 text-emerald-500">
                                            {isSpecificAgency ? selectedAgency : 'Base Agency'} Price
                                            {isSpecificAgency && (
                                                <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-normal text-emerald-400">
                                                    Override
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                    {isSpecificAgency && (
                                        <th className="px-4 py-3 text-xs text-muted-foreground/60">Base Rate (ref)</th>
                                    )}
                                    {isRangeMode && <th className="px-4 py-3 w-1"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {ROOM_TYPES.map((room) => (
                                    <tr key={room.id} className="hover:bg-emerald-500/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{room.label}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="number"
                                                    value={agencyPrices[room.id]?.amount || ''}
                                                    onChange={(e) => handleAgencyInputChange(room.id, 'amount', e.target.value)}
                                                    className="flex-1 min-w-[100px] bg-background border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 font-medium"
                                                    placeholder={isSpecificAgency ? `Base: ${getBaseSpecialPrice(room.id)}` : '0.00'}
                                                />
                                                <Select
                                                    value={agencyPrices[room.id]?.currency || 'EUR'}
                                                    onValueChange={(v) => handleAgencyInputChange(room.id, 'currency', v)}
                                                >
                                                    <SelectTrigger className="w-[85px] bg-background border-input h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CURRENCIES.map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                        {isSpecificAgency && (
                                            <td className="px-4 py-3 text-sm text-muted-foreground/60 font-mono">
                                                {getBaseSpecialPrice(room.id)} {getBaseSpecialCurrency(room.id)}
                                            </td>
                                        )}
                                        {isRangeMode && (
                                            <td className="px-4 py-3 text-xs text-muted-foreground w-1 whitespace-nowrap">
                                                {t('pricing.table.allDays')}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Save Agency Prices */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveAgency}
                            disabled={savingAgency || loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]"
                        >
                            {savingAgency ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" />Save {isSpecificAgency ? selectedAgency : 'Base Agency'}</>
                            )}
                        </Button>
                    </div>

                    {/* Agency Management */}
                    <div className="mt-4 border-t border-border/30 pt-6">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">{t('pricing.agencies.title')}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{t('pricing.agencies.empty')}</p>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('pricing.agencies.placeholder')}
                                    value={newAgencyName}
                                    onChange={(e) => setNewAgencyName(e.target.value)}
                                    className="max-w-xs bg-background"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddAgency()
                                    }}
                                />
                                <Button variant="secondary" onClick={handleAddAgency} disabled={!newAgencyName.trim()}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t('pricing.agencies.add')}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {agencies.map((agency, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-full text-sm font-medium">
                                        {agency}
                                        <button
                                            onClick={() => handleRemoveAgency(agency)}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
