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
    BedDouble,
    KeyRound,
    ClipboardCheck,
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'

interface OperationsGridProps {
    onSelect: (tabIs: string) => void
    userRole?: string
}

export function OperationsGrid({ onSelect, userRole }: OperationsGridProps) {
    const { t, language } = useLanguageStore()

    const items = [
        {
            id: 'messaging',
            label: t('module.messaging'),
            icon: MessageCircle,
            color: 'bg-blue-500/10 text-blue-500',
            desc: t('operations.messaging.desc')
        },
        {
            id: 'compliance',
            label: t('module.compliance') || 'Compliance',
            icon: ShieldCheck,
            color: 'bg-emerald-500/10 text-emerald-500',
            desc: t('operations.compliance.desc') || 'KBS & Agency check-ins',
        },
        {
            id: 'feedback',
            label: t('module.complaints'),
            icon: ShieldAlert,
            color: 'bg-red-500/10 text-red-500',
            desc: t('operations.feedback.desc')
        },
        {
            id: 'off-days',
            label: t('module.offDays'),
            icon: CalendarDays,
            color: 'bg-purple-500/10 text-purple-500',
            desc: t('operations.offdays.desc')
        },
        {
            id: 'tours',
            label: t('module.tours'),
            icon: Map,
            color: 'bg-emerald-500/10 text-emerald-500',
            desc: t('operations.tours.desc')
        },
        {
            id: 'rooms',
            label: t('dashboard.rooms'),
            icon: BedDouble,
            color: 'bg-indigo-500/10 text-indigo-500',
            desc: t('operations.rooms.desc')
        },
        {
            id: 'cards-loans',
            label: t('module.cards-loans'),
            icon: KeyRound,
            color: 'bg-amber-500/10 text-amber-500',
            desc: t('operations.cards-loans.desc')
        },
        {
            id: 'sales',
            label: t('module.sales'),
            icon: CreditCard,
            color: 'bg-amber-500/10 text-amber-500',
            desc: t('operations.sales.desc')
        },
        {
            id: 'pricing',
            label: t('module.pricing_label'),
            icon: DollarSign,
            color: 'bg-green-500/10 text-green-500',
            desc: t('operations.pricing.desc')
        },
        {
            id: 'team',
            label: t('module.team_label'),
            icon: Users,
            color: 'bg-pink-500/10 text-pink-500',
            desc: t('operations.team.desc')
        },
    ]

    if (userRole === 'gm') {
        items.push({
            id: 'attendance',
            label: language === 'tr' ? 'Mesai Raporları' : 'Attendance',
            icon: ClipboardCheck,
            color: 'bg-cyan-500/10 text-cyan-500',
            desc: language === 'tr' ? 'Giriş, çıkış ve geç kalma kayıtları' : 'Clock-in, clock-out and late records',
        })
        items.push({
            id: 'activity',
            label: t('module.activity'),
            icon: ScrollText,
            color: 'bg-orange-500/10 text-orange-500',
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
        <div className="p-4 lg:p-6 pb-32 overflow-y-auto h-full relative custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 px-1">{t('dashboard.operationsHub')}</h2>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 max-w-[1400px]"
            >
                {items.map((item) => (
                    <motion.button
                        key={item.id}
                        variants={itemAnim}
                        onClick={() => onSelect(item.id)}
                        whileTap={{ scale: 0.97 }}
                        className="group relative flex flex-col items-start p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/70 hover:border-border transition-colors text-left active:scale-[0.98]"
                    >
                        <div className={cn("p-2.5 rounded-lg mb-3 transition-colors", item.color)}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm tracking-tight mb-0.5">{item.label}</span>
                        <span className="text-xs text-muted-foreground leading-snug">{item.desc}</span>
                    </motion.button>
                ))}
            </motion.div>
            <ScrollToTopButton />
        </div>
    )
}
