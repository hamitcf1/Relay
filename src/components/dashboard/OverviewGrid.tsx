import { motion } from 'framer-motion'
import {
    ClipboardList,
    Hotel,
    Calendar,
    Utensils,
    DollarSign,
    Users
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

interface OverviewGridProps {
    onSelect: (tabIs: string) => void
    userRole?: string
}

export function OverviewGrid({ onSelect, userRole }: OverviewGridProps) {
    const { t } = useLanguageStore()

    const items = [
        {
            id: 'notes',
            label: t('module.shiftNotes'),
            icon: ClipboardList,
            desc: t('overview.notes.desc')
        },
        {
            id: 'hotel-info',
            label: t('module.hotelInfo'),
            icon: Hotel,
            desc: t('overview.hotel.desc')
        },
        {
            id: 'calendar',
            label: t('module.calendar'),
            icon: Calendar,
            desc: t('overview.calendar.desc')
        },
        {
            id: 'menu',
            label: t('menu.title'),
            icon: Utensils,
            desc: t('overview.menu.desc')
        },
        {
            id: 'currency',
            label: t('currency.title'),
            icon: DollarSign,
            desc: t('overview.currency.desc')
        },
    ]

    // Roster is only for GM/Receptionist
    if (userRole === 'gm' || userRole === 'receptionist') {
        items.push({
            id: 'roster',
            label: t('module.roster'),
            icon: Users,
            desc: t('overview.roster.desc')
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
        <section className="pb-2">
            <div className="mb-5 px-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Relay workspace</p>
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">{t('module.overview')}</h2>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
                {items.map((item) => (
                    <motion.button
                        key={item.id}
                        variants={itemAnim}
                        onClick={() => onSelect(item.id)}
                        whileTap={{ scale: 0.97 }}
                        className="group relative min-h-36 overflow-hidden rounded-[1.35rem] border-[5px] border-surface-deep bg-card p-4 text-left ring-1 ring-border/30 transition-[transform,border-color,background-color] duration-500 ease-premium hover:-translate-y-1 hover:border-primary/20 hover:bg-card/80 active:scale-[0.98]"
                    >
                        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-500 ease-premium group-hover:scale-105">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className="mb-1 text-sm font-semibold tracking-tight">{item.label}</span>
                        <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
                    </motion.button>
                ))}
            </motion.div>
        </section>
    )
}
