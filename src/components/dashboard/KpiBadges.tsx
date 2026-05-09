import { useMemo } from 'react'
import { FileText, ShoppingBag, AlertCircle } from 'lucide-react'
import { useNotesStore } from '@/stores/notesStore'
import { useSalesStore } from '@/stores/salesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface KpiBadgeProps {
    icon: React.ReactNode
    value: number | string
    label: string
    accent?: 'default' | 'warning' | 'success'
    onClick?: () => void
}

function KpiBadge({ icon, value, label, accent = 'default', onClick }: KpiBadgeProps) {
    const accentClass = {
        default: 'text-foreground',
        warning: 'text-amber-500',
        success: 'text-emerald-500',
    }[accent]

    const Component = onClick ? 'button' : 'div'

    return (
        <Component
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border/50 bg-card/40 transition-colors',
                onClick && 'hover:bg-card/70 hover:border-border active:scale-[0.98]'
            )}
            aria-label={`${label}: ${value}`}
        >
            <div className="text-muted-foreground" aria-hidden="true">{icon}</div>
            <span className={cn('text-sm font-semibold tabular-nums leading-none', accentClass)}>{value}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium leading-none">{label}</span>
        </Component>
    )
}

interface KpiBadgesProps {
    onNavigate?: (tab: string, subTab?: string) => void
}

export function KpiBadges({ onNavigate }: KpiBadgesProps) {
    const notes = useNotesStore(s => s.notes)
    const sales = useSalesStore(s => s.sales)
    const language = useLanguageStore(s => s.language)

    const stats = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const openNotes = notes.filter(n => n.status === 'active').length
        const todaySales = sales.filter(s => {
            const created = s.created_at instanceof Date ? s.created_at : new Date((s.created_at as any)?.seconds * 1000 || s.created_at)
            return format(created, 'yyyy-MM-dd') === today
        })
        const todayCount = todaySales.length
        const pendingPayment = sales.filter(s => s.payment_status !== 'paid' && s.status !== 'cancelled').length

        return { openNotes, todayCount, pendingPayment }
    }, [notes, sales])

    const todayLabel = language === 'tr' ? 'Bugün' : 'Today'
    const openLabel = language === 'tr' ? 'Aktif' : 'Open'
    const dueLabel = language === 'tr' ? 'Bekleyen' : 'Due'

    if (stats.openNotes === 0 && stats.todayCount === 0 && stats.pendingPayment === 0) {
        return null
    }

    return (
        <div className="hidden lg:flex items-center gap-1.5">
            {stats.openNotes > 0 && (
                <KpiBadge
                    icon={<FileText className="w-3.5 h-3.5" />}
                    value={stats.openNotes}
                    label={openLabel}
                    accent={stats.openNotes > 5 ? 'warning' : 'default'}
                    onClick={onNavigate ? () => onNavigate('overview') : undefined}
                />
            )}
            {stats.todayCount > 0 && (
                <KpiBadge
                    icon={<ShoppingBag className="w-3.5 h-3.5" />}
                    value={stats.todayCount}
                    label={todayLabel}
                    onClick={onNavigate ? () => onNavigate('operations', 'sales') : undefined}
                />
            )}
            {stats.pendingPayment > 0 && (
                <KpiBadge
                    icon={<AlertCircle className="w-3.5 h-3.5" />}
                    value={stats.pendingPayment}
                    label={dueLabel}
                    accent="warning"
                    onClick={onNavigate ? () => onNavigate('operations', 'sales') : undefined}
                />
            )}
        </div>
    )
}
