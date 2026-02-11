import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Users, Building2 } from 'lucide-react'
import { usePriceStore } from '@/stores/priceStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { RoomType } from '@/types'

export function PriceInquiry() {
    const { hotel } = useHotelStore()
    const { prices, loadPrices, loading } = usePriceStore()
    const { t } = useLanguageStore()

    const ROOM_TYPES: { id: RoomType; label: string }[] = [
        { id: 'standard', label: t('room.standard') },
        { id: 'corner', label: t('room.corner') },
        { id: 'corner_jacuzzi', label: t('room.corner_jacuzzi') },
        { id: 'triple', label: t('room.triple') },
        { id: 'teras_suite', label: t('room.teras_suite') },
    ]

    const [dateKey, setDateKey] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [selectedRoom, setSelectedRoom] = useState<RoomType>('standard')
    const [selectedAgency, setSelectedAgency] = useState<string | null>(null)

    const priceData = prices[dateKey]?.prices?.[selectedRoom]

    useEffect(() => {
        if (hotel?.id) {
            loadPrices(hotel.id, dateKey, dateKey)
        }
    }, [hotel?.id, dateKey, loadPrices])

    // Determine what to show in the "Agency" price card
    const getAgencyDisplay = () => {
        if (!selectedAgency) {
            // No agency selected — show base special group price
            return {
                label: t('pricing.tier.special'),
                amount: priceData?.special_group?.amount || 0,
                currency: priceData?.special_group?.currency || 'EUR',
                badge: null,
            }
        }

        // Agency selected — check for specific price
        const agencyPrice = priceData?.agency_prices?.[selectedAgency]
        if (agencyPrice) {
            return {
                label: selectedAgency,
                amount: agencyPrice.amount,
                currency: agencyPrice.currency,
                badge: 'specific',
            }
        }

        // Agency selected but no specific price — fallback to base
        return {
            label: selectedAgency,
            amount: priceData?.special_group?.amount || 0,
            currency: priceData?.special_group?.currency || 'EUR',
            badge: 'fallback',
        }
    }

    const agencyDisplay = getAgencyDisplay()

    return (
        <Card className="w-full h-full border-border bg-card/50 backdrop-blur-xl flex flex-col shadow-lg">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                    <Search className="h-5 w-5 text-primary" />
                    {t('pricing.inquiry.title')}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    {t('pricing.inquiry.desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 pt-6">
                <div className="space-y-4">
                    {/* Date Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('pricing.date.selected')}</Label>
                        <Input
                            type="date"
                            value={dateKey}
                            onChange={(e) => setDateKey(e.target.value)}
                            className="w-full bg-background border-input text-foreground font-mono"
                        />
                    </div>

                    {/* Room Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('pricing.table.roomType')}</Label>
                        <Select
                            value={selectedRoom}
                            onValueChange={(v) => setSelectedRoom(v as RoomType)}
                        >
                            <SelectTrigger className="w-full border-input bg-background text-foreground">
                                <SelectValue placeholder={t('pricing.selectRoom')} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                {ROOM_TYPES.map((room) => (
                                    <SelectItem key={room.id} value={room.id}>
                                        {room.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Agency Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3 h-3 text-emerald-500" />
                            Agency
                        </Label>
                        {(hotel?.settings?.special_group_agencies?.length || 0) > 0 ? (
                            <Select
                                value={selectedAgency || '__none__'}
                                onValueChange={(v) => setSelectedAgency(v === '__none__' ? null : v)}
                            >
                                <SelectTrigger className="w-full border-input bg-background text-foreground">
                                    <SelectValue placeholder="Select agency..." />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem value="__none__">Base Rate (All Agencies)</SelectItem>
                                    {hotel!.settings.special_group_agencies!.map((agency) => (
                                        <SelectItem key={agency} value={agency}>
                                            {agency}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="p-3 bg-muted/20 rounded-lg border border-dashed border-border text-center">
                                <p className="text-xs text-muted-foreground">No agencies configured</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Standard Price Card */}
                    <div className="relative group overflow-hidden rounded-xl border border-border bg-background/50 p-4 transition-all hover:bg-muted/20 hover:border-primary/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">{t('pricing.tier.standard')}</span>
                            <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="relative flex items-baseline gap-1">
                            {loading ? (
                                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-foreground">
                                        {priceData?.standard?.amount || 0}
                                        <span className="text-base ml-1 font-normal text-muted-foreground">
                                            {priceData?.standard?.currency || 'EUR'}
                                        </span>
                                    </span>
                                    <span className="text-sm text-muted-foreground">{t('pricing.perNight')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Agency / Special Group Price Card */}
                    <div className="relative group overflow-hidden rounded-xl border border-border bg-background/50 p-4 transition-all hover:bg-muted/20 hover:border-emerald-500/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {agencyDisplay.label}
                                </span>
                                {agencyDisplay.badge === 'specific' && (
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                                        Specific Rate
                                    </span>
                                )}
                                {agencyDisplay.badge === 'fallback' && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                                        Base Rate
                                    </span>
                                )}
                            </div>
                            <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="relative flex items-baseline gap-1">
                            {loading ? (
                                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-foreground">
                                        {agencyDisplay.amount}
                                        <span className="text-base ml-1 font-normal text-muted-foreground">
                                            {agencyDisplay.currency}
                                        </span>
                                    </span>
                                    <span className="text-sm text-muted-foreground">{t('pricing.perNight')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {!priceData && !loading && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                        {t('pricing.noPrices')}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
