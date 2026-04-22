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
import { cn } from '@/lib/utils'

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
            color: 'bg-blue-500/10 text-blue-500',
            desc: t('overview.notes.desc')
        },
        {
            id: 'hotel-info',
            label: t('module.hotelInfo'),
            icon: Hotel,
            color: 'bg-purple-500/10 text-purple-500',
            desc: t('overview.hotel.desc')
        },
        {
            id: 'calendar',
            label: t('module.calendar'),
            icon: Calendar,
            color: 'bg-emerald-500/10 text-emerald-500',
            desc: t('overview.calendar.desc')
        },
        {
            id: 'menu',
            label: t('menu.title'),
            icon: Utensils,
            color: 'bg-orange-500/10 text-orange-500',
            desc: t('overview.menu.desc')
        },
        {
            id: 'currency',
            label: t('currency.title'),
            icon: DollarSign,
            color: 'bg-green-500/10 text-green-500',
            desc: t('overview.currency.desc')
        },
    ]

    // Roster is only for GM/Receptionist
    if (userRole === 'gm' || userRole === 'receptionist') {
        items.push({
            id: 'roster',
            label: t('module.roster'),
            icon: Users,
            color: 'bg-pink-500/10 text-pink-500',
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
        <div className="p-4 pb-32">
            <h2 className="text-2xl font-bold mb-6 px-1">{t('module.overview')}</h2>

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
                        whileHover={{ scale: 1.02 }}
                        className="group relative flex flex-col items-start p-5 rounded-2xl card-modern text-left overflow-hidden"
                    >
                        <div className={cn("p-3 rounded-xl mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg", item.color)}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-base tracking-tight mb-1">{item.label}</span>
                        <span className="text-xs text-muted-foreground font-medium leading-snug">{item.desc}</span>

                        {/* Gradient Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
                    </motion.button>
                ))}
            </motion.div>
        </div>
    )
}
