import { motion } from 'framer-motion'
import {
    MessageCircle,
    ShieldAlert,
    ShieldCheck,
    CalendarDays,
    Map,
    CreditCard,
    DollarSign,
    Users,
    ScrollText,
    KeyRound,
    ClipboardCheck,
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'

interface OperationsGridProps {
    onSelect: (tabIs: string) => void
    userRole?: string
}

export function OperationsGrid({ onSelect, userRole }: OperationsGridProps) {
    const { t } = useLanguageStore()

    const items = [
        {
            id: 'messaging',
            label: t('module.messaging'),
            icon: MessageCircle,
            desc: t('operations.messaging.desc')
        },
        {
            id: 'compliance',
            label: t('module.compliance') || 'Compliance',
            icon: ShieldCheck,
            desc: t('operations.compliance.desc') || 'KBS & Agency check-ins',
        },
        {
            id: 'feedback',
            label: t('module.complaints'),
            icon: ShieldAlert,
            desc: t('operations.feedback.desc')
        },
        {
            id: 'off-days',
            label: t('module.offDays'),
            icon: CalendarDays,
            desc: t('operations.offdays.desc')
        },
        {
            id: 'tours',
            label: t('module.tours'),
            icon: Map,
            desc: t('operations.tours.desc')
        },
        {
            id: 'cards-loans',
            label: t('module.cards-loans'),
            icon: KeyRound,
            desc: t('operations.cards-loans.desc')
        },
        {
            id: 'sales',
            label: t('module.sales'),
            icon: CreditCard,
            desc: t('operations.sales.desc')
        },
        {
            id: 'pricing',
            label: t('module.pricing_label'),
            icon: DollarSign,
            desc: t('operations.pricing.desc')
        },
        {
            id: 'team',
            label: t('module.team_label'),
            icon: Users,
            desc: t('operations.team.desc')
        },
    ]

    if (userRole === 'gm') {
        items.push({
            id: 'attendance',
            label: t('module.attendance'),
            icon: ClipboardCheck,
            desc: t('operations.attendance.desc'),
        })
        items.push({
            id: 'activity',
            label: t('module.activity'),
            icon: ScrollText,
            desc: t('operations.activity.desc')
        })
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <section className="relative pb-6">
            <div className="mb-5 px-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Relay workspace</p>
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">{t('dashboard.operationsHub')}</h2>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                {items.map((item) => (
                    <motion.button
                        key={item.id}
                        variants={itemAnim}
                        onClick={() => onSelect(item.id)}
                        whileTap={{ scale: 0.97 }}
                        className="group relative min-h-40 overflow-hidden rounded-[1.35rem] border-[5px] border-surface-deep bg-card p-4 text-left ring-1 ring-border/30 transition-[transform,border-color,background-color] duration-500 ease-premium hover:-translate-y-1 hover:border-primary/20 hover:bg-card/80 active:scale-[0.98]"
                    >
                        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-500 ease-premium group-hover:scale-105">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className="mb-1 text-sm font-semibold tracking-tight">{item.label}</span>
                        <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
                    </motion.button>
                ))}
            </motion.div>
            <ScrollToTopButton />
        </section>
    )
}
