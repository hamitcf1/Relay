import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { type NoteCategory, type NoteStatus, categoryInfo } from '@/stores/notesStore'
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

export function NoteFilters({ statusFilter, setStatusFilter, filter, setFilter, searchQuery, setSearchQuery, counts }: NoteFiltersProps) {
    const { t } = useLanguageStore()
    const statusTabs = [
        { key: 'active' as const, label: t('status.active') || 'Active' },
        { key: 'resolved' as const, label: t('status.resolved') || 'Resolved' },
        { key: 'archived' as const, label: t('status.archived') || 'Archived' },
        { key: 'all' as const, label: t('status.all') || 'All' },
    ]
    const categories = [
        { key: 'all' as const, label: t('category.allIssues') || 'All issues', color: 'bg-primary' },
        { key: 'handover' as const, label: t('category.handover') || 'Handover', color: categoryInfo.handover.color },
        { key: 'payment_needed' as const, label: t('category.paymentNeeded') || 'Payment', color: categoryInfo.payment_needed.color },
        { key: 'guest_info' as const, label: t('category.guestInfo') || 'Guest info', color: categoryInfo.guest_info.color },
        { key: 'feedback' as const, label: t('category.feedback') || 'Feedback', color: categoryInfo.feedback.color },
        { key: 'damage' as const, label: t('category.damage') || 'Damage', color: categoryInfo.damage.color },
        { key: 'upgrade' as const, label: t('category.upgrade') || 'Upgrade', color: categoryInfo.upgrade.color },
        { key: 'restaurant' as const, label: t('category.restaurant') || 'Restaurant', color: categoryInfo.restaurant.color },
        { key: 'minibar' as const, label: t('category.minibar') || 'Minibar', color: categoryInfo.minibar.color },
        { key: 'early_checkout' as const, label: t('category.earlyCheckout') || 'Early checkout', color: categoryInfo.early_checkout.color },
        { key: 'other' as const, label: t('category.other') || 'Other', color: categoryInfo.other.color },
    ]

    return (
        <div className="handover-filters">
            <div className="handover-filters__primary">
                <div className="handover-filters__status" role="tablist">
                    {statusTabs.map((tab) => (
                        <button key={tab.key} onClick={() => setStatusFilter(tab.key)} role="tab" aria-selected={statusFilter === tab.key} className={cn(statusFilter === tab.key && 'is-active')}>
                            <span>{tab.label}</span>{counts[tab.key] > 0 && <strong>{counts[tab.key]}</strong>}
                        </button>
                    ))}
                </div>
                <label className="handover-filters__search">
                    <Search />
                    <Input type="search" aria-label={t('common.search') as string} placeholder={t('common.search') as string} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                </label>
            </div>

            <div className="handover-filters__categories" aria-label={t('category.allIssues') as string}>
                {categories.map((category) => (
                    <button key={category.key} onClick={() => setFilter(category.key)} className={cn(filter === category.key && 'is-active')}>
                        <span className={category.color} /><span>{category.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
