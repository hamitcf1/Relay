import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { NoteCategory, NoteStatus, categoryInfo } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'

interface NoteFiltersProps {
    statusFilter: NoteStatus | 'all'
    setStatusFilter: (status: NoteStatus | 'all') => void
    filter: NoteCategory | 'all'
    setFilter: (category: NoteCategory | 'all') => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    counts: Record<string, number>
}

export function NoteFilters({
    statusFilter,
    setStatusFilter,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    counts
}: NoteFiltersProps) {
    const { t } = useLanguageStore()

    return (
        <div className="pt-2">
            {/* Status Tabs */}
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg" role="tablist">
                    {[
                        { key: 'active' as const, label: t('status.active') || 'Active' },
                        { key: 'resolved' as const, label: t('status.resolved') || 'Resolved' },
                        { key: 'archived' as const, label: t('status.archived') || 'Archived' },
                        { key: 'all' as const, label: t('status.all') || 'All' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            role="tab"
                            aria-selected={statusFilter === tab.key}
                            className={cn(
                                'h-7 px-3 rounded-md text-xs font-medium transition-colors',
                                statusFilter === tab.key
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {tab.label}
                            {counts[tab.key] > 0 && <span className="ml-1.5 opacity-60 tabular-nums">{counts[tab.key]}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {[
                        { key: 'all' as const, label: t('category.allIssues') || 'All Issues', color: 'bg-primary' },
                        { key: 'handover' as const, color: categoryInfo.handover.color, label: t('category.handover') || 'Handover' },
                        { key: 'feedback' as const, color: categoryInfo.feedback.color, label: t('category.feedback') || 'Feedback' },
                        { key: 'damage' as const, color: categoryInfo.damage.color, label: t('category.damage') || 'Damage' },
                        { key: 'upgrade' as const, color: categoryInfo.upgrade.color, label: t('category.upgrade') || 'Upgrade' },
                        { key: 'payment_needed' as const, color: categoryInfo.payment_needed.color, label: t('category.paymentNeeded') || 'Payment' },
                        { key: 'restaurant' as const, color: categoryInfo.restaurant.color, label: t('category.restaurant') || 'Restaurant' },
                        { key: 'minibar' as const, color: categoryInfo.minibar.color, label: t('category.minibar') || 'Minibar' },
                        { key: 'guest_info' as const, color: categoryInfo.guest_info.color, label: t('category.guestInfo') || 'Guest Info' },
                        { key: 'early_checkout' as const, color: categoryInfo.early_checkout.color, label: t('category.earlyCheckout') || 'Early Out' },
                        { key: 'other' as const, color: categoryInfo.other.color, label: t('category.other') || 'Other' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'text-xs px-2.5 h-7 rounded-full flex items-center gap-1.5 transition-colors border',
                                filter === tab.key
                                    ? 'bg-foreground/10 text-foreground border-foreground/20'
                                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
                            )}
                        >
                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', tab.color)} aria-hidden="true" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="w-full sm:w-auto relative">
                    <Input
                        type="text"
                        placeholder={(t('common.search' as any) as string) || 'Search notes...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 text-sm h-8 pl-8 pr-2"
                    />
                    <svg className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>
        </div>
    )
}
