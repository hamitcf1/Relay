import { motion } from 'framer-motion'
import {
    LayoutDashboard,
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
    CircleDollarSign,
    Info,
    Utensils,
    UserX,
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { cn } from '@/lib/utils'

interface OperationsGridProps {
    onSelect: (tabIs: string) => void
    userRole?: string
}

export function OperationsGrid({ onSelect, userRole }: OperationsGridProps) {
    const { t, language } = useLanguageStore()

    const items: Array<{
        id: string
        label: string
        icon: typeof LayoutDashboard
        desc: string
        featured?: boolean
    }> = [
        {
            id: 'overview',
            label: language === 'tr' ? 'Operasyon özeti' : language === 'ru' ? 'Обзор операций' : 'Operations overview',
            icon: LayoutDashboard,
            desc: language === 'tr' ? 'Günün durumu, açık işler ve tahsilatlar' : language === 'ru' ? 'Состояние дня, задачи и платежи' : 'Today, open work and payments',
            featured: true,
        },
        {
            id: 'compliance',
            label: t('module.compliance') || 'Compliance',
            icon: ShieldCheck,
            desc: t('operations.compliance.desc') || 'KBS & Agency check-ins',
        },
        {
            id: 'hotel-info',
            label: t('module.cashInfo'),
            icon: Info,
            desc: t('overview.hotel.desc'),
        },
        {
            id: 'currency',
            label: t('module.currencyConverter'),
            icon: CircleDollarSign,
            desc: t('overview.currency.desc'),
        },
        {
            id: 'calendar',
            label: t('module.calendar'),
            icon: CalendarDays,
            desc: t('overview.calendar.desc'),
        },
        {
            id: 'menu',
            label: t('menu.title'),
            icon: Utensils,
            desc: t('overview.menu.desc'),
        },
        {
            id: 'blacklist',
            label: t('blacklist.title'),
            icon: UserX,
            desc: language === 'tr' ? 'Riskli misafir kayıtları' : language === 'ru' ? 'Записи о нежелательных гостях' : 'Restricted guest records',
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
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {language === 'tr' ? 'Relay çalışma alanı' : language === 'ru' ? 'Рабочая область Relay' : 'Relay workspace'}
                </p>
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
                        className={cn(
                            "group relative min-h-[7.5rem] overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-3.5 text-left shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card active:scale-[0.98]",
                            item.featured && "col-span-2 min-h-[6.5rem] border-primary/25 bg-primary/[0.055]"
                        )}
                    >
                        <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-105">
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
