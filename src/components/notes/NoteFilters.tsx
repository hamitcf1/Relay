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
            <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg border border-border/50">
                {[
                    { key: 'active' as const, label: t('status.active') || 'Active', color: 'bg-emerald-500' },
                    { key: 'resolved' as const, label: t('status.resolved') || 'Resolved', color: 'bg-indigo-500' },
                    { key: 'archived' as const, label: t('status.archived') || 'Archived', color: 'bg-zinc-600' },
                    { key: 'all' as const, label: t('status.all') || 'All', color: 'bg-zinc-400' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={cn(
                            'flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-all',
                            statusFilter === tab.key
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span className="ml-1 opacity-60">({counts[tab.key]})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Category Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {[
                        { key: 'all' as const, label: t('category.allIssues') || 'All Issues', color: 'bg-indigo-500', icon: '📁' },
                        { key: 'handover' as const, ...categoryInfo.handover, label: t('category.handover') || 'Handover' },
                        { key: 'feedback' as const, ...categoryInfo.feedback, label: t('category.feedback') || 'Feedback' },
                        { key: 'damage' as const, ...categoryInfo.damage, label: t('category.damage') || 'Damage' },
                        { key: 'upgrade' as const, ...categoryInfo.upgrade, label: t('category.upgrade') || 'Upgrade' },
                        { key: 'payment_needed' as const, ...categoryInfo.payment_needed, label: t('category.paymentNeeded') || 'Payment' },
                        { key: 'restaurant' as const, ...categoryInfo.restaurant, label: t('category.restaurant') || 'Restaurant' },
                        { key: 'minibar' as const, ...categoryInfo.minibar, label: t('category.minibar') || 'Minibar' },
                        { key: 'guest_info' as const, ...categoryInfo.guest_info, label: t('category.guestInfo') || 'Guest Info' },
                        { key: 'early_checkout' as const, ...categoryInfo.early_checkout, label: t('category.earlyCheckout') || 'Early Out' },
                        { key: 'other' as const, ...categoryInfo.other, label: t('category.other') || 'Other' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all',
                                filter === tab.key
                                    ? `${tab.color} text-white shadow-lg`
                                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <span>{tab.icon}</span>
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
                        className="bg-muted/50 w-full sm:w-48 text-sm h-8 pl-8 pr-2"
                    />
                    <svg className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>
        </div>
    )
}
