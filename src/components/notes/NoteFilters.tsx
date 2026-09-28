import { Search, CheckSquare, Square, Printer, Trash2, CheckCircle2, RotateCcw, Archive } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type NoteCategory, type NoteStatus } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'

interface NoteFiltersProps {
    statusFilter: NoteStatus | 'all'
    setStatusFilter: (status: NoteStatus | 'all') => void
    filter: NoteCategory | 'all'
    setFilter: (category: NoteCategory | 'all') => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    counts: Record<string, number>
    selectedCount?: number
    totalCount?: number
    onToggleSelectAll?: () => void
    onPrintPdf?: () => void
    onEmptyTrash?: () => void
    isGM?: boolean
    onBulkStatus?: (status: NoteStatus) => void
    onBulkDelete?: () => void
}

export function NoteFilters({
    statusFilter,
    setStatusFilter,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    counts,
    selectedCount = 0,
    totalCount = 0,
    onToggleSelectAll,
    onPrintPdf,
    onEmptyTrash,
    isGM,
    onBulkStatus,
    onBulkDelete,
}: NoteFiltersProps) {
    const { t, language } = useLanguageStore()
    const statusTabs = [
        { key: 'active' as const, label: t('status.active') || 'Active' },
        { key: 'resolved' as const, label: t('status.resolved') || 'Resolved' },
        { key: 'archived' as const, label: t('status.archived') || 'Archived' },
        { key: 'trash' as const, label: t('status.trash') || 'Çöp Kutusu' },
        { key: 'all' as const, label: t('status.all') || 'All' },
    ]
    const categories = [
        { key: 'all' as const, label: t('category.allIssues') || 'All issues', color: 'bg-primary shadow-[0_0_6px_hsl(var(--primary))]' },
        { key: 'handover' as const, label: t('category.handover') || 'Handover', color: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]' },
        { key: 'payment_needed' as const, label: t('category.paymentNeeded') || 'Payment', color: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]' },
        { key: 'guest_info' as const, label: t('category.guestInfo') || 'Guest info', color: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]' },
        { key: 'feedback' as const, label: t('category.feedback') || 'Feedback', color: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.6)]' },
        { key: 'damage' as const, label: t('category.damage') || 'Damage', color: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]' },
        { key: 'upgrade' as const, label: t('category.upgrade') || 'Upgrade', color: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' },
        { key: 'restaurant' as const, label: t('category.restaurant') || 'Restaurant', color: 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.6)]' },
        { key: 'minibar' as const, label: t('category.minibar') || 'Minibar', color: 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]' },
        { key: 'early_checkout' as const, label: t('category.earlyCheckout') || 'Early checkout', color: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]' },
        { key: 'other' as const, label: t('category.other') || 'Other', color: 'bg-slate-400' },
    ]

    return (
        <div className="space-y-3.5">
            {/* Row 1: Status Pills + Search Bar */}
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full shrink-0" role="tablist">
                    {statusTabs.map((tab) => {
                        const isActive = statusFilter === tab.key
                        const count = counts[tab.key] || 0
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                role="tab"
                                aria-selected={isActive}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap shrink-0",
                                    isActive
                                        ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                                )}
                            >
                                <span>{tab.label}</span>
                                {count > 0 && (
                                    <span className={cn(
                                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
                                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        aria-label={t('common.search') as string}
                        placeholder={t('common.search') as string}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-9 text-xs pl-9 pr-3 rounded-xl border-border/60 bg-background/60 focus:bg-background transition-all"
                    />
                </div>
            </div>

            {/* Row 2: Category Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:custom-scrollbar max-w-full" aria-label={t('category.allIssues') as string}>
                {categories.map((category) => {
                    const isActive = filter === category.key
                    return (
                        <button
                            key={category.key}
                            onClick={() => setFilter(category.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all duration-200 border",
                                isActive
                                    ? "bg-primary/10 border-primary/40 text-foreground font-semibold shadow-xs"
                                    : "bg-card/40 border-border/40 text-muted-foreground hover:bg-card/80 hover:text-foreground hover:border-border/70"
                            )}
                        >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", category.color)} />
                            <span>{category.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Row 3: Integrated Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-border/40">
                <div className="flex items-center gap-2 flex-wrap">
                    {onToggleSelectAll && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleSelectAll}
                            className="h-8 text-xs gap-1.5 rounded-lg border-border/60 bg-card/60 hover:bg-card"
                        >
                            {selectedCount > 0 && selectedCount === totalCount ? (
                                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                            ) : (
                                <Square className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span>{selectedCount > 0 ? `${selectedCount} / ${totalCount} ${language === 'tr' ? 'Seçildi' : 'Selected'}` : (language === 'tr' ? 'Tümünü Seç' : 'Select All')}</span>
                        </Button>
                    )}

                    {selectedCount > 0 && (
                        <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 p-1 rounded-lg">
                            {onBulkStatus && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onBulkStatus('resolved')}
                                        className="h-7 px-2 text-xs gap-1 text-emerald-400 hover:bg-emerald-500/10"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{t('status.resolved') || 'Resolved'}</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onBulkStatus('active')}
                                        className="h-7 px-2 text-xs gap-1 text-sky-400 hover:bg-sky-500/10"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>{t('status.active') || 'Active'}</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onBulkStatus('archived')}
                                        className="h-7 px-2 text-xs gap-1 text-slate-400 hover:bg-slate-500/10"
                                    >
                                        <Archive className="w-3 h-3" />
                                        <span>{t('status.archived') || 'Archived'}</span>
                                    </Button>
                                </>
                            )}
                            {onBulkDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onBulkDelete}
                                    className="h-7 px-2 text-xs gap-1 text-rose-400 hover:bg-rose-500/10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>{language === 'tr' ? 'Sil' : 'Delete'}</span>
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {onPrintPdf && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrintPdf}
                            className="h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 shadow-xs"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{language === 'tr' ? 'Devir Tutanağı Yazdır' : 'Print Handover PDF'}</span>
                        </Button>
                    )}

                    {statusFilter === 'trash' && isGM && onEmptyTrash && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onEmptyTrash}
                            className="h-8 text-xs gap-1.5 rounded-lg shadow-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'tr' ? 'Çöp Kutusunu Temizle' : 'Empty Trash'}</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
