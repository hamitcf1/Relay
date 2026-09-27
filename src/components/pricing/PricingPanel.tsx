import { useState, useEffect, useMemo } from 'react'
import { format, addDays as addDaysFns, parseISO, isBefore } from 'date-fns'
import { tr, enUS, ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Loader2,
    Building2,
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    Search,
    Zap,
    Sparkles,
    Table as TableIcon,
    Pencil,
    Calculator,
    CheckCircle2,
    CalendarDays,
    Layers,
    Sparkle
} from 'lucide-react'
import { usePricingStore } from '@/stores/pricingStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn, formatDisplayDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import type { RoomType, PricingCurrency, RoomPriceEntry, Agency, AgencyOverride, BaseOverride } from '@/types'

const ROOM_TYPES: RoomType[] = ['standard', 'corner', 'corner_jacuzzi', 'triple', 'teras_suite']

export function PricingPanel() {
    const { user } = useAuthStore()
    const { t, language } = useLanguageStore()
    const confirm = useConfirm()
    const isGM = user?.role === 'gm'
    const hotelId = user?.hotel_id

    const dateLocale = useMemo(() => {
        if (language === 'tr') return tr
        if (language === 'ru') return ru
        return enUS
    }, [language])

    const {
        basePrices,
        baseOverrides,
        agencies,
        loading,
        subscribeToBasePrices,
        subscribeToBaseOverrides,
        subscribeToAgencies,
        addAgency,
        removeAgency,
        setBasePrices,
        updateAgencyBasePrices,
        setBaseOverride,
        setAgencyOverride,
        removeBaseOverride,
        removeAgencyOverride,
        getEffectivePrice
    } = usePricingStore()

    // Default tab is 'calculator' (Price Calculator & Nightly Breakdown)
    const [activeTab, setActiveTab] = useState<'calculator' | 'matrix' | 'campaigns'>('calculator')

    // Modal & Drawer States
    const [editPricesTarget, setEditPricesTarget] = useState<{ id: string; name: string; prices: Record<string, RoomPriceEntry> } | null>(null)
    const [addAgencyOpen, setAddAgencyOpen] = useState(false)
    const [addAgencyName, setAddAgencyName] = useState('')
    const [isAddingAgency, setIsAddingAgency] = useState(false)

    // Subscriptions
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

    const totalOverridesCount = useMemo(() => {
        const globalCount = baseOverrides.length
        const agencyCount = agencies.reduce((acc, a) => acc + (a.overrides?.length || 0), 0)
        return globalCount + agencyCount
    }, [baseOverrides, agencies])

    if (!user || !hotelId) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (loading && !basePrices) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header & Priority Hierarchy Guide */}
            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-r from-background/80 via-background/40 to-amber-500/5 p-6 backdrop-blur-xl shadow-2xl">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
                                <CalendarIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                Sezonluk & Tarihsel Fiyat Yönetimi
                            </h1>
                            {isGM ? (
                                <Badge variant="default" className="ml-2 font-mono text-[10px] bg-amber-500 text-white">
                                    Yönetici Erişimi
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="ml-2 font-mono text-[10px] text-muted-foreground">
                                    Salt Okunur Görünüm
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            Otelin tüm oda fiyatları tarih aralıkları ve sezon kontratları üzerinden yönetilir.
                        </p>
                    </div>

                    {/* Priority Resolution Hierarchy Pills */}
                    <div className="rounded-2xl border border-border/40 bg-background/50 p-3 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            <Layers className="w-3.5 h-3.5 text-amber-500" />
                            <span>{t('pricing.hierarchy.title')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold">
                                {t('pricing.hierarchy.step1')}
                            </span>
                            <span className="text-muted-foreground/60">→</span>
                            <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">
                                {t('pricing.hierarchy.step2')}
                            </span>
                            <span className="text-muted-foreground/60">→</span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                                {t('pricing.hierarchy.step3')}
                            </span>
                            <span className="text-muted-foreground/60">→</span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                                {t('pricing.hierarchy.step4')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs (Primary Tab: Price Calculator & Nightly Breakdown) */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
                <div className="flex justify-center">
                    <TabsList className="bg-background/60 backdrop-blur-xl border border-border/50 p-1 rounded-2xl gap-1 shadow-2xl h-auto">
                        <TabsTrigger
                            value="calculator"
                            className="rounded-xl px-5 py-2.5 gap-2 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                        >
                            <Calculator className="w-4 h-4" />
                            <span>{t('pricing.tabs.calculator')}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="matrix"
                            className="rounded-xl px-5 py-2.5 gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                        >
                            <TableIcon className="w-4 h-4" />
                            <span>{t('pricing.tabs.matrix')}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="campaigns"
                            className="rounded-xl px-5 py-2.5 gap-2 text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            <span>{t('pricing.tabs.campaigns')}</span>
                            {totalOverridesCount > 0 && (
                                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-background/30 border-0">
                                    {totalOverridesCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: PRICE CALCULATOR (PRIMARY DEFAULT VIEW) */}
                <TabsContent value="calculator" className="space-y-6 focus-visible:outline-none">
                    <PriceCalculatorView
                        agencies={agencies}
                        baseOverrides={baseOverrides}
                        getEffectivePrice={getEffectivePrice}
                        dateLocale={dateLocale}
                    />
                </TabsContent>

                {/* TAB 2: AGENCY SEASON MATRIX OVERVIEW */}
                <TabsContent value="matrix" className="space-y-6 focus-visible:outline-none">
                    <RateMatrixView
                        agencies={agencies}
                        basePrices={basePrices}
                        isGM={isGM}
                        onEditPrices={(id, name, prices) => setEditPricesTarget({ id, name, prices })}
                        onOpenAddAgency={() => setAddAgencyOpen(true)}
                        onRemoveAgency={async (agencyId, name) => {
                            const confirmed = await confirm({
                                title: `${name} acentesi silinsin mi?`,
                                description: 'Bu acenteye tanımlı tüm özel fiyatlar ve sezonlar silinecektir.',
                                variant: 'destructive',
                                confirmLabel: t('common.delete'),
                            })
                            if (confirmed) {
                                await removeAgency(hotelId, agencyId)
                                toast.success(`${name} silindi.`)
                            }
                        }}
                    />
                </TabsContent>

                {/* TAB 3: SEASONAL / DATE-RANGE RATES */}
                <TabsContent value="campaigns" className="space-y-6 focus-visible:outline-none">
                    <SpecialPeriodsCampaignsView
                        agencies={agencies}
                        baseOverrides={baseOverrides}
                        isGM={isGM}
                        hotelId={hotelId}
                        setBaseOverride={setBaseOverride}
                        setAgencyOverride={setAgencyOverride}
                        removeBaseOverride={removeBaseOverride}
                        removeAgencyOverride={removeAgencyOverride}
                    />
                </TabsContent>
            </Tabs>

            {/* EDIT BASE / AGENCY PRICES MODAL (For GM) */}
            {editPricesTarget && (
                <EditPricesModal
                    target={editPricesTarget}
                    isOpen={Boolean(editPricesTarget)}
                    onClose={() => setEditPricesTarget(null)}
                    onSave={async (newPrices) => {
                        try {
                            if (editPricesTarget.id === 'global') {
                                await setBasePrices(hotelId, newPrices, user.uid)
                            } else {
                                await updateAgencyBasePrices(hotelId, editPricesTarget.id, newPrices)
                            }
                            toast.success(`${editPricesTarget.name} kaydedildi.`)
                            setEditPricesTarget(null)
                        } catch (err) {
                            console.error(err)
                            toast.error('Fiyatlar kaydedilirken hata oluştu.')
                        }
                    }}
                />
            )}

            {/* ADD AGENCY DIALOG (For GM) */}
            <Dialog open={addAgencyOpen} onOpenChange={setAddAgencyOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            {t('pricing.agencies.add')}
                        </DialogTitle>
                        <DialogDescription>
                            Oteliniz ile özel sezonsal anlaşması olan yeni bir seyahat acentesi tanımlayın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Acente Adı
                        </label>
                        <Input
                            placeholder={t('pricing.agencies.placeholder')}
                            value={addAgencyName}
                            onChange={(e) => setAddAgencyName(e.target.value)}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && addAgencyName.trim()) {
                                    setIsAddingAgency(true)
                                    try {
                                        await addAgency(hotelId, addAgencyName.trim())
                                        toast.success(`${addAgencyName.trim()} eklendi.`)
                                        setAddAgencyName('')
                                        setAddAgencyOpen(false)
                                    } finally {
                                        setIsAddingAgency(false)
                                    }
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setAddAgencyOpen(false)}>
                            İptal
                        </Button>
                        <Button
                            disabled={!addAgencyName.trim() || isAddingAgency}
                            onClick={async () => {
                                setIsAddingAgency(true)
                                try {
                                    await addAgency(hotelId, addAgencyName.trim())
                                    toast.success(`${addAgencyName.trim()} eklendi.`)
                                    setAddAgencyName('')
                                    setAddAgencyOpen(false)
                                } finally {
                                    setIsAddingAgency(false)
                                }
                            }}
                        >
                            {isAddingAgency && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Acente Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

/* ============================================================================
 * 1. SEASONAL & DATE-RANGE RATES VIEW (TAB 1 - PRIMARY)
 * ============================================================================ */
function SpecialPeriodsCampaignsView({
    agencies,
    baseOverrides,
    isGM,
    hotelId,
    setBaseOverride,
    setAgencyOverride,
    removeBaseOverride,
    removeAgencyOverride
}: {
    agencies: Agency[]
    baseOverrides: BaseOverride[]
    isGM: boolean
    hotelId: string
    setBaseOverride: (hotelId: string, override: BaseOverride) => Promise<void>
    setAgencyOverride: (hotelId: string, agencyId: string, override: AgencyOverride) => Promise<void>
    removeBaseOverride: (hotelId: string, overrideId: string) => Promise<void>
    removeAgencyOverride: (hotelId: string, agencyId: string, overrideId: string) => Promise<void>
}) {
    const { t } = useLanguageStore()
    const confirm = useConfirm()

    const [targetFilter, setTargetFilter] = useState<'all' | 'global' | string>('all')
    const [sortOrder, setSortOrder] = useState<'approaching' | 'newest'>('approaching')
    const [showAIAssistant, setShowAIAssistant] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editingOverride, setEditingOverride] = useState<{ targetId: string; override: BaseOverride | AgencyOverride } | null>(null)

    // Merge all overrides into a unified flat array
    const allOverrides = useMemo(() => {
        const list: Array<{
            id: string
            targetId: string // 'global' or agencyId
            targetName: string
            override: BaseOverride | AgencyOverride
            isGlobal: boolean
        }> = []

        baseOverrides.forEach((bo) => {
            list.push({
                id: `global_${bo.id}`,
                targetId: 'global',
                targetName: 'Genel Acentalar (Tüm Herkes)',
                override: bo,
                isGlobal: true
            })
        })

        agencies.forEach((ag) => {
            (ag.overrides || []).forEach((ao) => {
                list.push({
                    id: `${ag.id}_${ao.id}`,
                    targetId: ag.id,
                    targetName: ag.name,
                    override: ao,
                    isGlobal: false
                })
            })
        })

        return list
    }, [baseOverrides, agencies])

    const filteredOverrides = useMemo(() => {
        let result = [...allOverrides]

        if (targetFilter === 'global') {
            result = result.filter((item) => item.isGlobal)
        } else if (targetFilter !== 'all') {
            result = result.filter((item) => item.targetId === targetFilter)
        }

        if (sortOrder === 'approaching') {
            result.sort((a, b) => a.override.start_date.localeCompare(b.override.start_date))
        } else {
            result.sort((a, b) => b.override.start_date.localeCompare(a.override.start_date))
        }

        return result
    }, [allOverrides, targetFilter, sortOrder])

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-amber-500" />
                        Sezonlar & Tarihsel Fiyat Tarifeleri
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Tarih aralıklarına (Yaz sezonu, bayram, fuar, düşük sezon vb.) göre tanımlanmış oda fiyat kontratları.
                    </p>
                </div>

                {isGM && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAIAssistant(!showAIAssistant)}
                            className={cn("gap-2 h-9 text-xs border-amber-500/30", showAIAssistant && "bg-amber-500/10 text-amber-500 border-amber-500")}
                        >
                            <Sparkle className="w-4 h-4 text-amber-500" />
                            AI Asistanı {showAIAssistant ? 'Kapat' : 'Aç'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                            className="gap-2 h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Sezon / Tarih Aralığı Ekle
                        </Button>
                    </div>
                )}
            </div>

            {/* AI ASSISTANT COLLAPSIBLE CARD */}
            <AnimatePresence>
                {showAIAssistant && isGM && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <AIPricingAgentCard
                            hotelId={hotelId}
                            agencies={agencies}
                            setBaseOverride={setBaseOverride}
                            setAgencyOverride={setAgencyOverride}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FILTERS TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hedef Acente:</span>
                    <Select value={targetFilter} onValueChange={setTargetFilter}>
                        <SelectTrigger className="h-8 w-52 text-xs bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Sezon Tarifeleri ({allOverrides.length})</SelectItem>
                            <SelectItem value="global">Genel Acentalar (Tüm Herkes)</SelectItem>
                            {agencies.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name} ({a.overrides?.length || 0} Sezon)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sıralama:</span>
                    <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as any)}>
                        <SelectTrigger className="h-8 w-40 text-xs bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="approaching">Tarihe Göre (Yaklaşan)</SelectItem>
                            <SelectItem value="newest">Eklenme Tarihine Göre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* OVERRIDES LIST CARDS */}
            <div className="grid grid-cols-1 gap-4">
                {filteredOverrides.length === 0 ? (
                    <Card className="border-dashed border-2 border-border/40 bg-muted/5 p-12 text-center text-muted-foreground">
                        <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30 text-amber-500" />
                        <p className="text-sm font-semibold">Henüz tanımlanmış sezonsal tarih aralığı bulunmuyor.</p>
                        <p className="text-xs mt-1">Özel sezon veya tarih aralıklı fiyat kontratı tanımlamak için yukarıdaki butonu kullanabilirsiniz.</p>
                    </Card>
                ) : (
                    filteredOverrides.map((item) => {
                        const today = format(new Date(), 'yyyy-MM-dd')
                        const isCurrent = today >= item.override.start_date && today <= item.override.end_date
                        const isUpcoming = today < item.override.start_date
                        const isPast = today > item.override.end_date

                        let totalNights = 0
                        try {
                            const d1 = parseISO(item.override.start_date)
                            const d2 = parseISO(item.override.end_date)
                            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                                totalNights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
                            }
                        } catch (_e) {}

                        return (
                            <Card
                                key={item.id}
                                className={cn(
                                    "border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden transition-all duration-300 relative group shadow-md",
                                    isCurrent && "border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10",
                                    item.isGlobal ? "bg-gradient-to-r from-purple-500/5 via-background/50 to-background/50" : "bg-gradient-to-r from-blue-500/5 via-background/50 to-background/50"
                                )}
                            >
                                <div className="p-4 sm:p-5 space-y-4">
                                    {/* Top Bar: Target & Status & Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Target Tag */}
                                            <Badge
                                                variant={item.isGlobal ? 'default' : 'secondary'}
                                                className={cn(
                                                    "font-bold text-xs px-3 py-1 rounded-xl shadow-sm",
                                                    item.isGlobal ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                                                )}
                                            >
                                                {item.isGlobal ? <Building2 className="w-3.5 h-3.5 mr-1 inline" /> : <Building2 className="w-3.5 h-3.5 mr-1 inline" />}
                                                {item.targetName}
                                            </Badge>

                                            {/* Status Badge */}
                                            {isCurrent && (
                                                <Badge variant="success" className="animate-pulse flex items-center gap-1 font-bold">
                                                    <Zap className="w-3 h-3" />
                                                    Şu An Aktif Sezon
                                                </Badge>
                                            )}
                                            {isUpcoming && (
                                                <Badge variant="outline" className="text-amber-500 border-amber-500/40 bg-amber-500/10 font-bold">
                                                    Yaklaşan Sezon
                                                </Badge>
                                            )}
                                            {isPast && (
                                                <Badge variant="outline" className="text-muted-foreground opacity-60">
                                                    Geçmiş Sezon
                                                </Badge>
                                            )}

                                            {/* Date Pill */}
                                            <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary bg-background/80 px-3 py-1 rounded-xl border border-border/40 shadow-inner">
                                                <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                                                <span>{formatDisplayDate(item.override.start_date)}</span>
                                                <span className="text-muted-foreground font-normal">→</span>
                                                <span>{formatDisplayDate(item.override.end_date)}</span>
                                                {totalNights > 0 && (
                                                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-mono bg-muted/60">
                                                        {totalNights} Gece
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* GM Actions */}
                                        {isGM && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1.5 bg-background/80 hover:bg-muted"
                                                    onClick={() =>
                                                        setEditingOverride({
                                                            targetId: item.targetId,
                                                            override: item.override
                                                        })
                                                    }
                                                >
                                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Düzenle
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={async () => {
                                                        const confirmed = await confirm({
                                                            title: 'Sezon / Tarih aralığı silinsin mi?',
                                                            description: `${item.targetName} acentesine ait bu sezon kontratı kalıcı olarak silinecektir.`,
                                                            variant: 'destructive',
                                                            confirmLabel: t('common.delete')
                                                        })
                                                        if (confirmed) {
                                                            if (item.isGlobal) {
                                                                await removeBaseOverride(hotelId, item.override.id)
                                                            } else {
                                                                await removeAgencyOverride(hotelId, item.targetId, item.override.id)
                                                            }
                                                            toast.success('Tarihsel sezonsal kural silindi.')
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Room Prices Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                                        {ROOM_TYPES.map((room) => {
                                            const p = item.override.prices?.[room]
                                            return (
                                                <div
                                                    key={room}
                                                    className={cn(
                                                        "p-2.5 rounded-2xl border transition-all flex flex-col gap-1",
                                                        p?.amount
                                                            ? "bg-background/90 border-border/50 shadow-sm"
                                                            : "bg-muted/10 border-border/20 opacity-50"
                                                    )}
                                                >
                                                    <span className="text-[10px] text-muted-foreground font-bold truncate capitalize">
                                                        {t(`room.${room}`)}
                                                    </span>
                                                    <span className="font-mono font-extrabold text-sm text-foreground">
                                                        {p?.amount ? (
                                                            <>
                                                                <span className="text-[9px] font-medium text-amber-500 mr-1">{p.currency || 'EUR'}</span>
                                                                {p.amount.toFixed(2)}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 font-light text-xs">Tanımsız</span>
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* CREATE / EDIT OVERRIDE DIALOG */}
            {(createModalOpen || editingOverride) && (
                <OverrideEditorModal
                    agencies={agencies}
                    isOpen={createModalOpen || Boolean(editingOverride)}
                    initialTargetId={editingOverride?.targetId || 'global'}
                    initialData={editingOverride?.override}
                    onClose={() => {
                        setCreateModalOpen(false)
                        setEditingOverride(null)
                    }}
                    onSave={async (targetId, overrideData) => {
                        try {
                            if (targetId === 'global') {
                                await setBaseOverride(hotelId, overrideData)
                            } else {
                                await setAgencyOverride(hotelId, targetId, overrideData)
                            }
                            toast.success('Sezonluk fiyat kontratı kaydedildi.')
                            setCreateModalOpen(false)
                            setEditingOverride(null)
                        } catch (err) {
                            console.error(err)
                            toast.error('Sezon kaydedilirken hata oluştu.')
                        }
                    }}
                />
            )}
        </div>
    )
}

/* ============================================================================
 * 2. AGENCY & SEASON MATRIX OVERVIEW (TAB 2)
 * ============================================================================ */
function RateMatrixView({
    agencies,
    basePrices,
    isGM,
    onEditPrices,
    onOpenAddAgency,
    onRemoveAgency
}: {
    agencies: Agency[]
    basePrices: any
    isGM: boolean
    onEditPrices: (id: string, name: string, prices: Record<string, RoomPriceEntry>) => void
    onOpenAddAgency: () => void
    onRemoveAgency: (agencyId: string, name: string) => void
}) {
    const { t } = useLanguageStore()
    const [searchQuery, setSearchQuery] = useState('')

    const globalPrices = useMemo(() => (basePrices?.prices || {}) as Record<string, RoomPriceEntry>, [basePrices])

    const filteredAgencies = useMemo(() => {
        if (!searchQuery.trim()) return agencies
        const q = searchQuery.toLocaleLowerCase('tr')
        return agencies.filter(a => a.name.toLocaleLowerCase('tr').includes(q))
    }, [agencies, searchQuery])

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="border-b border-border/30 bg-muted/20 py-4 relative z-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TableIcon className="w-5 h-5 text-primary" />
                            Acente & Sezon Matrisi Özeti
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Acentelere tanımlanmış toplam sezon kontratları ve varsayılan acente tarifeleri.
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                            <Input
                                placeholder="Acente ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-9 w-44 text-xs bg-background/80"
                            />
                        </div>
                        {isGM && (
                            <Button size="sm" onClick={onOpenAddAgency} className="gap-2 h-9 text-xs">
                                <Plus className="w-4 h-4" />
                                {t('pricing.agencies.add')}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 relative z-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30">
                            <tr>
                                <th className="p-3.5 pl-6 min-w-[220px]">Kaynak / Acente</th>
                                {ROOM_TYPES.map((room) => (
                                    <th key={room} className="p-3.5 text-center capitalize min-w-[110px]">
                                        {t(`room.${room}`)}
                                    </th>
                                ))}
                                {isGM && <th className="p-3.5 text-right pr-6 min-w-[100px]">İşlem</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {/* ===== ROW 1: GENERAL AGENCY DEFAULT RATE ===== */}
                            <tr className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group/row">
                                <td className="p-3.5 pl-6">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30 shrink-0">
                                            <Building2 className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                                <span>{t('pricing.matrix.baseLabel')}</span>
                                                <Badge variant="success" className="text-[9px] px-1.5 py-0 h-4">
                                                    Varsayılan
                                                </Badge>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">Özel sezonu olmayan tüm acenteler için geçerli tarife</div>
                                        </div>
                                    </div>
                                </td>
                                {ROOM_TYPES.map((room) => {
                                    const price = globalPrices[room]
                                    return (
                                        <td key={room} className="p-3.5 text-center">
                                            {price?.amount ? (
                                                <div className="inline-flex flex-col items-center px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                        {price.amount.toFixed(2)}
                                                    </span>
                                                    <span className="text-[8px] font-semibold text-emerald-500/70 uppercase">
                                                        {price.currency || 'EUR'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground/40 font-mono text-xs italic">Tanımsız</span>
                                            )}
                                        </td>
                                    )
                                })}
                                {isGM && (
                                    <td className="p-3.5 text-right pr-6">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1.5"
                                            onClick={() => onEditPrices('global', 'Genel Acenta Fiyatları', globalPrices)}
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Düzenle
                                        </Button>
                                    </td>
                                )}
                            </tr>

                            {/* ===== AGENCY ROWS ===== */}
                            {filteredAgencies.map((agency) => (
                                <tr key={agency.id} className="hover:bg-primary/5 transition-colors group/row">
                                    <td className="p-3.5 pl-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 shrink-0">
                                                <Building2 className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-foreground">{agency.name}</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {(agency.overrides?.length || 0) > 0 ? (
                                                        <span className="text-amber-500 font-medium flex items-center gap-1">
                                                            <Zap className="w-3 h-3 inline" />
                                                            {agency.overrides.length} Sezon Kontratı Tanımlı
                                                        </span>
                                                    ) : (
                                                        'Özel Anlaşmalı Acente'
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {ROOM_TYPES.map((room) => {
                                        const agencyPrice = agency.base_prices?.[room]
                                        const inheritsGlobal = !agencyPrice || agencyPrice.amount <= 0
                                        const displayPrice = inheritsGlobal ? globalPrices[room] : agencyPrice

                                        return (
                                            <td key={room} className="p-3.5 text-center">
                                                {displayPrice?.amount ? (
                                                    <div
                                                        className={cn(
                                                            "inline-flex flex-col items-center px-2.5 py-1 rounded-xl transition-colors",
                                                            inheritsGlobal
                                                                ? "bg-muted/30 border border-border/30 opacity-70"
                                                                : "bg-primary/10 border border-primary/20 text-primary font-bold shadow-sm"
                                                        )}
                                                    >
                                                        <span className="font-mono text-xs">
                                                            {displayPrice.amount.toFixed(2)}
                                                        </span>
                                                        <span className="text-[8px] opacity-60 uppercase font-medium">
                                                            {displayPrice.currency || 'EUR'} {inheritsGlobal && '(Genel)'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/30 font-mono text-xs">---</span>
                                                )}
                                            </td>
                                        )
                                    })}
                                    {isGM && (
                                        <td className="p-3.5 text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs border-border/50 hover:bg-primary/10"
                                                    onClick={() => onEditPrices(agency.id, `${agency.name} Özel Fiyatları`, agency.base_prices || {})}
                                                >
                                                    <Pencil className="w-3 h-3 mr-1 text-muted-foreground" />
                                                    Düzenle
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => onRemoveAgency(agency.id, agency.name)}
                                                    title={`${agency.name} sil`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}

                            {/* EMPTY STATE */}
                            {filteredAgencies.length === 0 && (
                                <tr>
                                    <td colSpan={ROOM_TYPES.length + 2} className="p-8 text-center text-muted-foreground text-xs italic">
                                        {searchQuery ? 'Aramanızla eşleşen acente bulunamadı.' : 'Henüz özel fiyatlı acente eklenmedi. Yukarıdaki "Acente Ekle" butonunu kullanabilirsiniz.'}
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

/* ============================================================================
 * EDIT PRICES MODAL (For GM to edit general or agency rates cleanly)
 * ============================================================================ */
function EditPricesModal({
    target,
    isOpen,
    onClose,
    onSave
}: {
    target: { id: string; name: string; prices: Record<string, RoomPriceEntry> }
    isOpen: boolean
    onClose: () => void
    onSave: (prices: Record<string, RoomPriceEntry>) => Promise<void>
}) {
    const { t } = useLanguageStore()
    const [prices, setPrices] = useState<Record<string, RoomPriceEntry>>({ ...target.prices })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setPrices({ ...target.prices })
    }, [target])

    const isGlobal = target.id === 'global'

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(prices)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-primary" />
                        {target.name}
                    </DialogTitle>
                    <DialogDescription>
                        {isGlobal
                            ? 'Özel anlaşma fiyatı tanımlanmamış tüm seyahat acenteleri için geçerli olacak genel acente oda fiyatlarını belirleyin.'
                            : 'Bu acenteye özel anlaşma oda fiyatlarını girin. Boş bırakılan oda türü Genel Acenta Fiyatını kullanacaktır.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ROOM_TYPES.map((room) => (
                            <div key={room} className="p-3 rounded-2xl bg-muted/20 border border-border/40 space-y-2">
                                <label className="text-[11px] font-bold block truncate capitalize text-muted-foreground">
                                    {t(`room.${room}`)}
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={isGlobal ? "Genel Fiyat" : "Genel fiyatı kullan"}
                                        value={prices[room]?.amount ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            if (val === '') {
                                                setPrices((prev) => {
                                                    const next = { ...prev }
                                                    delete next[room]
                                                    return next
                                                })
                                            } else {
                                                setPrices((prev) => ({
                                                    ...prev,
                                                    [room]: {
                                                        amount: parseFloat(val) || 0,
                                                        currency: prev[room]?.currency || 'EUR'
                                                    }
                                                }))
                                            }
                                        }}
                                        className="h-9 font-mono text-xs"
                                    />
                                    <Select
                                        value={prices[room]?.currency || 'EUR'}
                                        onValueChange={(curr) =>
                                            setPrices((prev) => ({
                                                ...prev,
                                                [room]: {
                                                    amount: prev[room]?.amount || 0,
                                                    currency: curr as PricingCurrency
                                                }
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-20 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Fiyatları Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/* ============================================================================
 * AI PRICING AGENT CARD
 * ============================================================================ */
function AIPricingAgentCard({
    hotelId,
    agencies,
    setBaseOverride,
    setAgencyOverride
}: {
    hotelId: string
    agencies: Agency[]
    setBaseOverride: (hotelId: string, override: BaseOverride) => Promise<void>
    setAgencyOverride: (hotelId: string, agencyId: string, override: AgencyOverride) => Promise<void>
}) {
    const [input, setInput] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const parseAndApply = async () => {
        if (!input.trim()) return
        setIsProcessing(true)
        setStatus('Girdi analiz ediliyor...')

        try {
            const lines = input.split('\n').filter((l) => l.trim())
            let count = 0

            for (const line of lines) {
                let parts = line.split('|').map((p) => p.trim())
                if (parts.length < 3 && line.includes('\t')) {
                    parts = line.split('\t').map((p) => p.trim())
                }

                if (parts.length < 3) continue

                const datePart = parts[0]
                const targetPart = parts[1]
                const pricePart = parts[2]

                const rawDates = datePart.split(/to|\s-\s/).map((d) => d.trim())
                const normalizeDate = (d: string) => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
                    const now = new Date()
                    const year = now.getFullYear()

                    const dotMatch = d.match(/^(\d{1,2})\.(\d{1,2})$/)
                    if (dotMatch) {
                        return `${year}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`
                    }

                    const parsed = new Date(d)
                    if (!isNaN(parsed.getTime())) {
                        return format(parsed, 'yyyy-MM-dd')
                    }
                    return null
                }

                const startDateStr = normalizeDate(rawDates[0])
                const endDateStr = normalizeDate(rawDates[1] || rawDates[0])

                if (!startDateStr || !endDateStr) continue

                const prices: Record<string, RoomPriceEntry> = {}
                pricePart.split(',').forEach((p) => {
                    const colonIndex = p.indexOf(':')
                    if (colonIndex === -1) return

                    const roomRaw = p.substring(0, colonIndex).trim().toLowerCase()
                    const valRaw = p.substring(colonIndex + 1).trim()

                    let detectedCurrency: PricingCurrency = 'EUR'
                    if (valRaw.includes('$') || valRaw.toLowerCase().includes('usd')) detectedCurrency = 'USD'
                    else if (valRaw.includes('€') || valRaw.toLowerCase().includes('eur')) detectedCurrency = 'EUR'

                    const cleanVal = valRaw.replace(',', '.').replace(/[^0-9.]/g, '')
                    const amount = parseFloat(cleanVal)

                    if (roomRaw && !isNaN(amount)) {
                        let matchedRoom: RoomType | undefined = ROOM_TYPES.find(
                            (r) => roomRaw.includes(r.replace('_', ' ')) || roomRaw.includes(r)
                        )
                        if (!matchedRoom) {
                            if (roomRaw.includes('terrace') || roomRaw.includes('teras')) matchedRoom = 'teras_suite'
                            if (roomRaw.includes('jacuzzi') || roomRaw.includes('jakuzi')) matchedRoom = 'corner_jacuzzi'
                        }
                        if (matchedRoom) {
                            prices[matchedRoom] = { amount, currency: detectedCurrency }
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

                    if (targetPart.toLowerCase() === 'everyone' || targetPart.toLowerCase() === 'herkes') {
                        await setBaseOverride(hotelId, override)
                        count++
                    } else {
                        const agency = agencies.find((a) => a.name.toLowerCase().includes(targetPart.toLowerCase()))
                        if (agency) {
                            await setAgencyOverride(hotelId, agency.id, override)
                            count++
                        }
                    }
                }
            }

            setStatus(`${count} adet özel dönem başarıyla eklendi!`)
            setInput('')
            setTimeout(() => setStatus(null), 4000)
        } catch (error) {
            console.error(error)
            setStatus('Format ayrıştırılırken hata oluştu.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Card className="border-amber-500/30 bg-amber-500/5 border-2 shadow-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI Fiyat Asistanı (Metinden Hızlı Ekle)
                </CardTitle>
                <CardDescription className="text-xs">
                    Tarih ve fiyatları metin halinde yapıştırarak saniyeler içinde özel dönemler oluşturun. Örnek format:
                    <code className="block mt-1 p-1 bg-background/50 rounded text-[10px] font-mono">
                        2026-07-01 to 2026-07-31 | Herkes | standard: 150 EUR, triple: 220 EUR
                    </code>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Textarea
                    placeholder="Verileri buraya yapıştırın..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[90px] font-mono text-xs bg-background/60"
                />
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-amber-500 font-medium">
                        {status || 'Pipe (|) veya sekme ile ayrılmış metin satırları desteklenir.'}
                    </p>
                    <Button
                        size="sm"
                        onClick={parseAndApply}
                        disabled={isProcessing || !input.trim()}
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        AI ile Uygula
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

/* ============================================================================
 * OVERRIDE EDITOR MODAL (For creating / editing special period overrides)
 * ============================================================================ */
function OverrideEditorModal({
    agencies,
    isOpen,
    initialTargetId,
    initialData,
    onClose,
    onSave
}: {
    agencies: Agency[]
    isOpen: boolean
    initialTargetId: string
    initialData?: BaseOverride | AgencyOverride
    onClose: () => void
    onSave: (targetId: string, override: BaseOverride | AgencyOverride) => Promise<void>
}) {
    const { t } = useLanguageStore()
    const [targetId, setTargetId] = useState<string>(initialTargetId || 'global')
    const [startDate, setStartDate] = useState(initialData?.start_date || format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(initialData?.end_date || format(addDaysFns(new Date(), 7), 'yyyy-MM-dd'))
    const [prices, setPrices] = useState<Record<string, RoomPriceEntry>>(initialData ? { ...initialData.prices } : {})
    const [bulkPrice, setBulkPrice] = useState('')
    const [bulkCurrency, setBulkCurrency] = useState<PricingCurrency>('EUR')
    const [isSaving, setIsSaving] = useState(false)

    // Calculate nights for validation display
    const calculatedNights = useMemo(() => {
        try {
            const d1 = parseISO(startDate)
            const d2 = parseISO(endDate)
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null
            const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
            return diff > 0 ? diff : null
        } catch (_e) {
            return null
        }
    }, [startDate, endDate])

    const handleApplyBulkPrice = () => {
        const val = parseFloat(bulkPrice)
        if (isNaN(val) || val <= 0) {
            toast.error('Lütfen geçerli bir toplu oda fiyatı girin.')
            return
        }
        const updated: Record<string, RoomPriceEntry> = {}
        ROOM_TYPES.forEach((r) => {
            updated[r] = { amount: val, currency: bulkCurrency }
        })
        setPrices(updated)
        toast.success(`Tüm oda tiplerine ${val} ${bulkCurrency} uygulandı.`)
    }

    const handleSave = async () => {
        if (!startDate || !endDate) {
            toast.error('Lütfen başlangıç ve bitiş tarihlerini girin.')
            return
        }

        const d1 = parseISO(startDate)
        const d2 = parseISO(endDate)
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            toast.error('Geçerli bir başlangıç ve bitiş tarihi girin.')
            return
        }

        if (d1.getFullYear() < 2000 || d1.getFullYear() > 2100 || d2.getFullYear() < 2000 || d2.getFullYear() > 2100) {
            toast.error('Yıl değeri 2000 - 2100 arasında olmalıdır.')
            return
        }

        if (d2 <= d1) {
            toast.error('Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.')
            return
        }

        setIsSaving(true)
        try {
            await onSave(targetId, {
                id: initialData?.id || `override_${Date.now()}`,
                start_date: startDate,
                end_date: endDate,
                prices
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        {initialData ? 'Sezon Kontratını Düzenle' : 'Yeni Sezon / Tarih Aralığı Ekle'}
                    </DialogTitle>
                    <DialogDescription>
                        Belirli tarih aralığında geçerli olacak sezonsal oda fiyat kontratını tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-5">
                    {/* Target & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/30">
                        <div className="space-y-1 sm:col-span-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Hedef Acente</label>
                            <Select value={targetId} onValueChange={setTargetId} disabled={Boolean(initialData)}>
                                <SelectTrigger className="h-9 text-xs bg-background font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Genel Acentalar (Tüm Herkes)</SelectItem>
                                    {agencies.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name} (Özel Anlaşmalı)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Başlangıç Tarihi</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs bg-background" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Bitiş Tarihi</label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-xs bg-background" />
                        </div>
                    </div>

                    {/* Calculated Nights Info */}
                    <div className="flex items-center justify-between text-xs px-1">
                        {calculatedNights ? (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Sezon Süresi: <span className="font-mono text-sm underline">{calculatedNights} Gece</span>
                            </span>
                        ) : (
                            <span className="text-amber-500 font-medium">Lütfen geçerli bir başlangıç ve bitiş tarihi girin.</span>
                        )}
                    </div>

                    {/* Bulk Price Application Helper */}
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            <span>Tüm Odalara Tek Fiyat Uygula:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                placeholder="Fiyat"
                                value={bulkPrice}
                                onChange={(e) => setBulkPrice(e.target.value)}
                                className="h-8 w-24 text-xs font-mono bg-background"
                            />
                            <Select value={bulkCurrency} onValueChange={(val) => setBulkCurrency(val as PricingCurrency)}>
                                <SelectTrigger className="h-8 w-20 text-xs bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" variant="secondary" onClick={handleApplyBulkPrice} className="h-8 text-xs font-bold">
                                Uygula
                            </Button>
                        </div>
                    </div>

                    {/* Prices Grid */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Oda Fiyat Tarifeleri</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ROOM_TYPES.map((room) => (
                                <div key={room} className="p-3 rounded-2xl bg-muted/20 border border-border/40 space-y-1.5">
                                    <label className="text-[11px] font-bold block truncate capitalize text-muted-foreground">
                                        {t(`room.${room}`)}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Fiyat"
                                            value={prices[room]?.amount ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === '') {
                                                    setPrices((prev) => {
                                                        const next = { ...prev }
                                                        delete next[room]
                                                        return next
                                                    })
                                                } else {
                                                    setPrices((prev) => ({
                                                        ...prev,
                                                        [room]: {
                                                            amount: parseFloat(val) || 0,
                                                            currency: prev[room]?.currency || 'EUR'
                                                        }
                                                    }))
                                                }
                                            }}
                                            className="h-8 font-mono text-xs"
                                        />
                                        <Select
                                            value={prices[room]?.currency || 'EUR'}
                                            onValueChange={(curr) =>
                                                setPrices((prev) => ({
                                                    ...prev,
                                                    [room]: {
                                                        amount: prev[room]?.amount || 0,
                                                        currency: curr as PricingCurrency
                                                    }
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="h-8 w-20 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Sezon Kontratını Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/* ============================================================================
 * 3. PRICE CALCULATOR VIEW (TAB 3)
 * ============================================================================ */
function PriceCalculatorView({
    agencies,
    baseOverrides,
    getEffectivePrice,
    dateLocale
}: {
    agencies: Agency[]
    baseOverrides: BaseOverride[]
    getEffectivePrice: (date: string, roomType: RoomType, agencyId?: string) => RoomPriceEntry | null
    dateLocale: any
}) {
    const { t } = useLanguageStore()
    
    // User Input States (No automatic calculation triggered on typing)
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(addDaysFns(new Date(), 3), 'yyyy-MM-dd'))
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>('base')
    const [selectedRoomType, setSelectedRoomType] = useState<RoomType>('standard')

    // Calculated Query State (Only updated when user explicitly clicks "Fiyat Sorgula / Hesapla")
    const [calculatedParams, setCalculatedParams] = useState<{
        startStr: string
        endStr: string
        agencyId: string
        roomType: RoomType
    } | null>({
        startStr: format(new Date(), 'yyyy-MM-dd'),
        endStr: format(addDaysFns(new Date(), 3), 'yyyy-MM-dd'),
        agencyId: 'base',
        roomType: 'standard'
    })

    const handleRunCalculation = () => {
        const start = parseISO(startDate)
        const end = parseISO(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            toast.error('Lütfen geçerli bir başlangıç ve bitiş tarihi girin.')
            return
        }

        const startYear = start.getFullYear()
        const endYear = end.getFullYear()
        if (startYear < 2000 || startYear > 2100 || endYear < 2000 || endYear > 2100) {
            toast.error('Yıl değeri 2000 ile 2100 arasında olmalıdır.')
            return
        }

        if (!isBefore(start, end)) {
            toast.error('Çıkış tarihi (Check-out), giriş tarihinden (Check-in) sonra olmalıdır.')
            return
        }

        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays > 365) {
            toast.error('Maksimum 365 gecelik konaklama hesaplanabilir.')
            return
        }

        setCalculatedParams({
            startStr: startDate,
            endStr: endDate,
            agencyId: selectedAgencyId,
            roomType: selectedRoomType
        })
    }

    // Perform calculation safely using calculatedParams
    const calculation = useMemo(() => {
        if (!calculatedParams) return null

        try {
            const { startStr, endStr, agencyId, roomType } = calculatedParams
            const start = parseISO(startStr)
            const end = parseISO(endStr)

            if (isNaN(start.getTime()) || isNaN(end.getTime()) || !isBefore(start, end)) {
                return null
            }

            const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
            if (nights > 365) return null

            const agencyIdArg = agencyId === 'base' ? undefined : agencyId
            const agencyObj = agencies.find((a) => a.id === agencyId)

            const dailyBreakdown: Array<{
                dateStr: string
                formattedDate: string
                price: RoomPriceEntry | null
                ruleName: string
                ruleType: 'agency_override' | 'global_override' | 'agency_base' | 'global_base' | 'none'
            }> = []

            let totalPrice = 0
            let primaryCurrency: PricingCurrency = 'EUR'

            for (let i = 0; i < nights; i++) {
                const currentDay = addDaysFns(start, i)
                const dateStr = format(currentDay, 'yyyy-MM-dd')
                const formattedDate = format(currentDay, 'dd MMMM yyyy, EEEE', { locale: dateLocale })

                let ruleName = 'Genel Acenta Fiyatı'
                let ruleType: 'agency_override' | 'global_override' | 'agency_base' | 'global_base' | 'none' = 'global_base'

                if (agencyIdArg && agencyObj) {
                    const agencyOverride = agencyObj.overrides?.find(
                        (o) => dateStr >= o.start_date && dateStr <= o.end_date && o.prices[roomType]?.amount
                    )
                    if (agencyOverride) {
                        ruleName = `${agencyObj.name} Özel Sezon Kontratı`
                        ruleType = 'agency_override'
                    } else if (agencyObj.base_prices?.[roomType]?.amount) {
                        ruleName = `${agencyObj.name} Standart Anlaşma Fiyatı`
                        ruleType = 'agency_base'
                    }
                }

                if (ruleType === 'global_base') {
                    const globalOverride = baseOverrides.find(
                        (o) => dateStr >= o.start_date && dateStr <= o.end_date && o.prices[roomType]?.amount
                    )
                    if (globalOverride) {
                        ruleName = 'Genel Acenta Sezon Tarifesi'
                        ruleType = 'global_override'
                    }
                }

                const price = getEffectivePrice(dateStr, roomType, agencyIdArg)
                if (price?.amount) {
                    totalPrice += price.amount
                    primaryCurrency = price.currency || 'EUR'
                } else {
                    ruleType = 'none'
                    ruleName = 'Fiyat Bulunamadı'
                }

                dailyBreakdown.push({
                    dateStr,
                    formattedDate,
                    price,
                    ruleName,
                    ruleType
                })
            }

            const avgPrice = nights > 0 ? totalPrice / nights : 0

            return {
                nights,
                totalPrice,
                avgPrice,
                primaryCurrency,
                dailyBreakdown
            }
        } catch (_e) {
            return null
        }
    }, [calculatedParams, agencies, baseOverrides, getEffectivePrice, dateLocale])

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="border-b border-border/30 bg-muted/20 py-4 relative z-10">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-500" />
                        Fiyat Hesaplama & Gece Kırılımı
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Tarih aralığı, oda tipi ve acente seçerek konaklama tutarını sorgulayın. Fiyatları görmek için tarihler seçildikten sonra <b>"Fiyatları Hesapla"</b> butonuna basın.
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 relative z-10">
                {/* Inputs Grid + Explicit Search / Calculate Button */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Giriş Tarihi (Check-in)
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 text-xs bg-background font-semibold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Çıkış Tarihi (Check-out)
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 text-xs bg-background font-semibold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Acente
                            </label>
                            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                                <SelectTrigger className="h-10 text-xs bg-background font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="base">Genel Acentalar (Varsayılan Sezonlar)</SelectItem>
                                    {agencies.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name} (Özel Anlaşmalı)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Oda Tipi
                            </label>
                            <Select value={selectedRoomType} onValueChange={(val) => setSelectedRoomType(val as RoomType)}>
                                <SelectTrigger className="h-10 text-xs bg-background font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPES.map((room) => (
                                        <SelectItem key={room} value={room}>
                                            {t(`room.${room}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-border/20 pt-3">
                        <Button
                            onClick={handleRunCalculation}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6 h-10 shadow-lg shadow-emerald-600/20"
                        >
                            <Search className="w-4 h-4" />
                            Fiyatları Hesapla / Sorgula
                        </Button>
                    </div>
                </div>

                {/* Calculation Summary Cards */}
                {calculation ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Total Stay Price */}
                            <Card className="border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col justify-between">
                                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    Toplam Konaklama Tutarı
                                </div>
                                <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                    <span className="text-sm font-normal mr-1">{calculation.primaryCurrency}</span>
                                    {calculation.totalPrice.toFixed(2)}
                                </div>
                            </Card>

                            {/* Nights */}
                            <Card className="border-border/40 bg-background/60 p-4 flex flex-col justify-between">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Gece Sayısı
                                </div>
                                <div className="mt-2 text-2xl font-extrabold font-mono text-foreground">
                                    {calculation.nights} <span className="text-xs font-normal text-muted-foreground">Gece</span>
                                </div>
                            </Card>

                            {/* Average Nightly Rate */}
                            <Card className="border-border/40 bg-background/60 p-4 flex flex-col justify-between">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Gecelik Ortalama Fiyat
                                </div>
                                <div className="mt-2 text-2xl font-extrabold font-mono text-foreground">
                                    <span className="text-sm font-normal mr-1 text-muted-foreground">{calculation.primaryCurrency}</span>
                                    {calculation.avgPrice.toFixed(2)}
                                </div>
                            </Card>
                        </div>

                        {/* Nightly Breakdown Table */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-emerald-500" />
                                Gecelik Fiyat Kırılımı ve Uygulanan Sezonlar
                            </h3>

                            <div className="border border-border/40 rounded-2xl overflow-hidden bg-background/60">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30">
                                        <tr>
                                            <th className="p-3 pl-4">Tarih</th>
                                            <th className="p-3 text-center">Gecelik Fiyat</th>
                                            <th className="p-3 pl-4">Uygulanan Sezon Kuralı</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {calculation.dailyBreakdown.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3 pl-4 font-semibold text-foreground">
                                                    {row.formattedDate}
                                                </td>
                                                <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {row.price?.amount ? (
                                                        <>
                                                            <span className="text-[9px] font-normal opacity-60 mr-1">
                                                                {row.price.currency || 'EUR'}
                                                            </span>
                                                            {row.price.amount.toFixed(2)}
                                                        </>
                                                    ) : (
                                                        <span className="text-destructive font-normal">Fiyat Yok</span>
                                                    )}
                                                </td>
                                                <td className="p-3 pl-4">
                                                    {row.ruleType === 'agency_override' && (
                                                        <Badge variant="default" className="bg-amber-500 text-white font-medium text-[11px]">
                                                            <Zap className="w-3 h-3 mr-1" />
                                                            {row.ruleName}
                                                        </Badge>
                                                    )}
                                                    {row.ruleType === 'global_override' && (
                                                        <Badge variant="default" className="bg-purple-600 text-white font-medium text-[11px]">
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            {row.ruleName}
                                                        </Badge>
                                                    )}
                                                    {row.ruleType === 'agency_base' && (
                                                        <Badge variant="secondary" className="font-medium text-[11px]">
                                                            <Building2 className="w-3 h-3 mr-1 text-primary" />
                                                            {row.ruleName}
                                                        </Badge>
                                                    )}
                                                    {row.ruleType === 'global_base' && (
                                                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-medium text-[11px]">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            {row.ruleName}
                                                        </Badge>
                                                    )}
                                                    {row.ruleType === 'none' && (
                                                        <Badge variant="destructive" className="font-medium text-[11px]">
                                                            {row.ruleName}
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs italic">
                        Tarihleri ve kriterleri seçtikten sonra <b>"Fiyatları Hesapla / Sorgula"</b> butonuna basarak hesaplamayı başlatın.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
