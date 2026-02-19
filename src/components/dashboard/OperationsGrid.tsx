import { motion } from 'framer-motion'
import {
    MessageCircle,
    ShieldAlert,
    CalendarDays,
    Map,
    CreditCard,
    DollarSign,
    Users,
    ScrollText,
    BedDouble
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

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
            color: 'bg-blue-500/10 text-blue-500',
            desc: t('operations.messaging.desc')
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
        <div className="p-4 pb-32 overflow-y-auto h-full">
            <h2 className="text-2xl font-bold mb-6 px-1">{t('dashboard.operationsHub')}</h2>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4"
            >
                {items.map((item) => (
                    <motion.button
                        key={item.id}
                        variants={itemAnim}
                        onClick={() => onSelect(item.id)}
                        whileTap={{ scale: 0.95 }}
                        className="group relative flex flex-col items-start p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left overflow-hidden"
                    >
                        <div className={cn("p-3 rounded-xl mb-3 transition-colors group-hover:bg-white/10", item.color)}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-sm tracking-tight mb-0.5">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.desc}</span>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.button>
                ))}
            </motion.div>
        </div>
    )
}
