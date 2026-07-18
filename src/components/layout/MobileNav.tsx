import { ArrowLeftRight, CalendarRange, MessageCircle, MoreHorizontal, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'

interface MobileNavProps {
    activeTab: string
    overviewTab: string
    operationTab: string
    onOpenNotes: () => void
    onOpenMenu: () => void
    onOpenRoster: () => void
    onNewRecord: () => void
    onOpenMessages: () => void
}

export function MobileNav({
    activeTab,
    overviewTab,
    operationTab,
    onOpenNotes,
    onOpenMenu,
    onOpenRoster,
    onNewRecord,
    onOpenMessages,
}: MobileNavProps) {
    const { language } = useLanguageStore()
    const labels = language === 'tr'
        ? { notes: 'Devir', roster: 'Haftalık', messages: 'Mesajlar', menu: 'Diğer', add: 'Devir kaydı ekle' }
        : language === 'ru'
            ? { notes: 'Передача', roster: 'График', messages: 'Сообщения', menu: 'Ещё', add: 'Добавить запись' }
            : { notes: 'Handover', roster: 'Roster', messages: 'Messages', menu: 'More', add: 'Add handover record' }

    const items = [
        {
            id: 'notes',
            label: labels.notes,
            icon: ArrowLeftRight,
            active: activeTab === 'overview' && overviewTab === 'notes',
            action: onOpenNotes,
        },
        {
            id: 'roster',
            label: labels.roster,
            icon: CalendarRange,
            active: activeTab === 'overview' && overviewTab === 'roster',
            action: onOpenRoster,
        },
        {
            id: 'messages',
            label: labels.messages,
            icon: MessageCircle,
            active: activeTab === 'operations' && operationTab === 'messaging',
            action: onOpenMessages,
        },
        {
            id: 'menu',
            label: labels.menu,
            icon: MoreHorizontal,
            active: activeTab === 'operations' && operationTab === 'grid',
            action: onOpenMenu,
        },
    ]

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden" aria-label="Mobile navigation">
            <div className="pointer-events-auto relative mx-auto grid h-[74px] max-w-md grid-cols-[1fr_1fr_72px_1fr_1fr] items-center rounded-[1.55rem] border border-border/90 bg-background/95 px-1.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06),0_24px_56px_-22px_hsl(0_0%_0%/0.9)] backdrop-blur-2xl">
                {items.slice(0, 2).map(item => <MobileItem key={item.id} {...item} />)}

                <button
                    onClick={onNewRecord}
                    aria-label={labels.add}
                    className="relative -top-4 mx-auto grid h-[62px] w-[62px] place-items-center rounded-full border-[5px] border-background bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.24),0_14px_32px_-12px_hsl(var(--primary)/0.8)] transition-transform duration-300 active:scale-95"
                >
                    <Plus className="h-8 w-8" strokeWidth={1.9} />
                </button>

                {items.slice(2).map(item => <MobileItem key={item.id} {...item} />)}
            </div>
        </nav>
    )
}

function MobileItem({ label, icon: Icon, active, action }: {
    label: string
    icon: typeof ArrowLeftRight
    active: boolean
    action: () => void
}) {
    return (
        <button onClick={action} aria-current={active ? 'page' : undefined} className={cn('relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors duration-300', active && 'text-primary')}>
            {active && <motion.span layoutId="relay-mobile-active" className="absolute inset-1 rounded-xl border border-primary/20 bg-primary/10" transition={{ type: 'spring', bounce: 0.15, duration: 0.55 }} />}
            <Icon className="relative z-10 h-5 w-5" strokeWidth={1.7} />
            <span className="relative z-10 max-w-full truncate text-[10px] font-medium">{label}</span>
        </button>
    )
}
