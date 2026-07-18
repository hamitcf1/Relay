import { ClipboardList, LayoutGrid, MessageCircle, MoreHorizontal, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'

interface MobileNavProps {
    activeTab: string
    overviewTab: string
    operationTab: string
    setActiveTab: (tab: string) => void
    onOpenMenu: () => void
    onOpenNotes: () => void
    onNewRecord: () => void
    onOpenMessages: () => void
}

export function MobileNav({
    activeTab,
    overviewTab,
    operationTab,
    setActiveTab,
    onOpenMenu,
    onOpenNotes,
    onNewRecord,
    onOpenMessages,
}: MobileNavProps) {
    const { language } = useLanguageStore()
    const labels = language === 'tr'
        ? { operations: 'Operasyon', daily: 'Günlük', messages: 'Mesajlar', menu: 'Menü', add: 'Yeni kayıt' }
        : language === 'ru'
            ? { operations: 'Операции', daily: 'Журнал', messages: 'Сообщения', menu: 'Меню', add: 'Новая запись' }
            : { operations: 'Operations', daily: 'Daily', messages: 'Messages', menu: 'Menu', add: 'New record' }

    const items = [
        {
            id: 'overview',
            label: labels.operations,
            icon: LayoutGrid,
            active: activeTab === 'overview' && overviewTab === 'grid',
            action: () => setActiveTab('overview'),
        },
        {
            id: 'daily',
            label: labels.daily,
            icon: ClipboardList,
            active: activeTab === 'overview' && overviewTab === 'notes',
            action: onOpenNotes,
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
            active: false,
            action: onOpenMenu,
        },
    ]

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden" aria-label="Mobile navigation">
            <div className="pointer-events-auto relative mx-auto grid h-[78px] max-w-md grid-cols-[1fr_1fr_78px_1fr_1fr] items-center rounded-[1.65rem] border border-border/90 bg-[#0a0d10]/95 px-1.5 shadow-[inset_0_1px_0_hsl(40_30%_95%/0.06),0_24px_56px_-22px_hsl(0_0%_0%/0.9)] backdrop-blur-2xl">
                {items.slice(0, 2).map(item => <MobileItem key={item.id} {...item} />)}

                <button
                    onClick={onNewRecord}
                    aria-label={labels.add}
                    className="relative -top-4 mx-auto grid h-[66px] w-[66px] place-items-center rounded-full border-[7px] border-[#17191b] bg-gradient-to-b from-[#ffbd32] to-[#f2a51a] text-[#090b0d] shadow-[inset_0_1px_0_hsl(48_100%_88%/0.7),0_14px_32px_-12px_hsl(38_89%_53%/0.8)] transition-transform duration-300 active:scale-95"
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
    icon: typeof LayoutGrid
    active: boolean
    action: () => void
}) {
    return (
        <button onClick={action} className={cn('relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors duration-300', active && 'text-primary')}>
            {active && <motion.span layoutId="relay-mobile-active" className="absolute inset-1 rounded-xl border border-primary/20 bg-primary/10" transition={{ type: 'spring', bounce: 0.15, duration: 0.55 }} />}
            <Icon className="relative z-10 h-5 w-5" strokeWidth={1.7} />
            <span className="relative z-10 max-w-full truncate text-[10px] font-medium">{label}</span>
        </button>
    )
}
