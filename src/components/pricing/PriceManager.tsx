import { useState, useEffect } from 'react'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import { Save, Loader2, CalendarRange, Calendar } from 'lucide-react'
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

    const [saving, setSaving] = useState(false)
    const [localPrices, setLocalPrices] = useState<Record<string, { standard: PriceState; special: PriceState }>>({})
    const [newAgencyName, setNewAgencyName] = useState('')

    const { updateHotelSettings } = useHotelStore()

    // Load prices for "StartDate" to show current values (even in range mode, we show start date's values as baseline)
    useEffect(() => {
        if (hotel?.id) {
            loadPrices(hotel.id, startDate, startDate)
        }
    }, [hotel?.id, startDate, loadPrices])

    // Update local state when store prices change (for the start date)
    useEffect(() => {
        const dayPrices = prices[startDate]
        const newLocalPrices: Record<string, { standard: PriceState; special: PriceState }> = {}

        ROOM_TYPES.forEach(room => {
            const priceData = dayPrices?.prices?.[room.id]
            // Safe access for nested optional properties
            const stdAmt = priceData?.standard?.amount?.toString() || ''
            const stdCurr = priceData?.standard?.currency || 'EUR'
            const splAmt = priceData?.special_group?.amount?.toString() || ''
            const splCurr = priceData?.special_group?.currency || 'EUR'

            newLocalPrices[room.id] = {
                standard: { amount: stdAmt, currency: stdCurr },
                special: { amount: splAmt, currency: splCurr }
            }
        })

        setLocalPrices(newLocalPrices)
    }, [prices, startDate]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleInputChange = (
        roomDetails: typeof ROOM_TYPES[0],
        tier: 'standard' | 'special',
        field: 'amount' | 'currency',
        value: string
    ) => {
        setLocalPrices(prev => ({
            ...prev,
            [roomDetails.id]: {
                ...prev[roomDetails.id],
                [tier]: {
                    ...prev[roomDetails.id]?.[tier],
                    [field]: value
                }
            }
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

        try {
            await updateHotelSettings(hotel.id, { special_group_agencies: updatedAgencies })
        } catch (error) {
            console.error("Failed to remove agency", error)
        }
    }

    const handleSave = async () => {
        if (!hotel?.id || !user?.uid) return
        setSaving(true)

        try {
            const daysToSave: string[] = []

            if (isRangeMode) {
                const start = parseISO(startDate)
                const end = parseISO(endDate)
                const diff = differenceInDays(end, start)

                if (diff < 0) {
                    alert("End date must be after start date.")
                    setSaving(false)
                    return
                }

                for (let i = 0; i <= diff; i++) {
                    daysToSave.push(format(addDays(start, i), 'yyyy-MM-dd'))
                }
            } else {
                daysToSave.push(startDate)
            }

            const promises = []

            for (const dateKey of daysToSave) {
                for (const room of ROOM_TYPES) {
                    const values = localPrices[room.id]
                    if (!values) continue

                    const standardAmount = parseFloat(values.standard.amount) || 0
                    const specialAmount = parseFloat(values.special.amount) || 0

                    if (standardAmount > 0 || specialAmount > 0) {
                        promises.push(setPrice(
                            hotel.id,
                            dateKey,
                            room.id,
                            'standard',
                            standardAmount,
                            values.standard.currency,
                            user.uid
                        ))
                        promises.push(setPrice(
                            hotel.id,
                            dateKey,
                            room.id,
                            'special_group',
                            specialAmount,
                            values.special.currency,
                            user.uid
                        ))
                    }
                }
            }

            await Promise.all(promises)
            alert(`Prices for ${isRangeMode ? `${daysToSave.length} days` : startDate} have been saved.`)
        } catch (error) {
            console.error(error)
            alert("Failed to save prices.")
        } finally {
            setSaving(false)
        }
    }

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

            <CardContent className="pt-6">
                <div className="rounded-lg border border-border overflow-hidden bg-background">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium">
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 w-[200px]">{t('pricing.table.roomType')}</th>
                                <th className="px-4 py-3">{t('pricing.table.standard')}</th>
                                <th className="px-4 py-3">{t('pricing.table.special')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {ROOM_TYPES.map((room) => (
                                <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">
                                        {room.label}
                                    </td>

                                    {/* Standard Price Column */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 items-center">
                                            <div className="relative flex-1 min-w-[100px]">
                                                <Input
                                                    type="number"
                                                    value={localPrices[room.id]?.standard?.amount || ''}
                                                    onChange={(e) => handleInputChange(room, 'standard', 'amount', e.target.value)}
                                                    className="bg-background border-input text-foreground focus:ring-primary transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <Select
                                                value={localPrices[room.id]?.standard?.currency || 'EUR'}
                                                onValueChange={(v) => handleInputChange(room, 'standard', 'currency', v)}
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

                                    {/* Special Price Column */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 items-center">
                                            <div className="relative flex-1 min-w-[100px]">
                                                <Input
                                                    type="number"
                                                    value={localPrices[room.id]?.special?.amount || ''}
                                                    onChange={(e) => handleInputChange(room, 'special', 'amount', e.target.value)}
                                                    className="bg-background border-input text-foreground focus:ring-emerald-500 transition-all font-medium text-emerald-600 dark:text-emerald-400"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <Select
                                                value={localPrices[room.id]?.special?.currency || 'EUR'}
                                                onValueChange={(v) => handleInputChange(room, 'special', 'currency', v)}
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

                <div className="mt-8 border-t border-border/50 pt-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">{t('pricing.agencies.title')}</h3>
                            <p className="text-sm text-muted-foreground">{t('pricing.agencies.empty')}</p>
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
                                {t('pricing.agencies.add')}
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {(hotel?.settings?.special_group_agencies || []).map((agency, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-full text-sm font-medium">
                                    {agency}
                                    <button
                                        onClick={() => handleRemoveAgency(agency)}
                                        className="hover:text-emerald-400 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {isRangeMode
                            ? t('pricing.info.range')
                            : t('pricing.info.single')}
                    </p>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('common.save')}...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isRangeMode ? t('pricing.save.range') : t('pricing.save.single')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
