import { MoreHorizontal, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { resolvePersonalNavigation, getModuleShortLabel } from '@/lib/navigation'
import { MOBILE_SLOT_COUNT, type ModuleDefinition } from '@/config/moduleRegistry'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'

interface MobileNavProps {
    activeTab: string
    overviewTab: string
    operationTab: string
    userRole?: string
    onSelect: (item: ModuleDefinition) => void
}

export function MobileNav({ activeTab, overviewTab, operationTab, userRole, onSelect }: MobileNavProps) {
    const { language } = useLanguageStore()
    const { openAllTabs, openQuickActions, allTabsOpen } = useNavigationStore()
    const navigationConfig = useHotelStore((state) => state.hotel?.settings.navigation)
    const preferences = useAuthStore((state) => state.user?.settings?.sidebar_preferences)
    const slots = resolvePersonalNavigation(userRole, navigationConfig, preferences).mobile.slice(0, MOBILE_SLOT_COUNT)
    const allTabsLabel = language === 'tr' ? 'Tümü' : language === 'ru' ? 'Все' : 'All'
    const addLabel = language === 'tr' ? 'Hızlı kayıt' : language === 'ru' ? 'Быстрое действие' : 'Quick action'
    const isActive = (item: ModuleDefinition) => item.area === 'overview'
        ? activeTab === 'overview' && (item.subTab ? overviewTab === item.subTab : overviewTab === 'grid')
        : activeTab === 'operations' && operationTab === item.subTab
    const half = Math.ceil(MOBILE_SLOT_COUNT / 2)

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] md:hidden" aria-label="Mobile navigation">
            <div className="pointer-events-auto relative mx-auto grid h-[70px] max-w-md grid-cols-[repeat(4,1fr)_58px_1fr] items-center rounded-2xl border border-border/90 bg-background/95 px-1 shadow-[0_18px_48px_-20px_hsl(215_30%_8%/0.7)] backdrop-blur-xl">
                {slots.slice(0, half).map((item) => <MobileItem key={item.id} item={item} label={getModuleShortLabel(item, language, navigationConfig)} active={isActive(item)} action={() => onSelect(item)} />)}
                <button onClick={openQuickActions} aria-label={addLabel} className="relative -top-3 mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[0_12px_26px_-12px_hsl(var(--primary)/0.8)] transition-transform active:scale-95">
                    <Plus className="h-7 w-7" strokeWidth={1.8} />
                </button>
                {slots.slice(half).map((item) => <MobileItem key={item.id} item={item} label={getModuleShortLabel(item, language, navigationConfig)} active={isActive(item)} action={() => onSelect(item)} />)}
                <button onClick={openAllTabs} aria-current={allTabsOpen ? 'page' : undefined} className={cn('relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground', allTabsOpen && 'text-primary')}>
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{allTabsLabel}</span>
                </button>
            </div>
        </nav>
    )
}

function MobileItem({ item, label, active, action }: { item: ModuleDefinition; label: string; active: boolean; action: () => void }) {
    const Icon = item.icon
    return (
        <button onClick={action} aria-current={active ? 'page' : undefined} className={cn('relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors', active && 'text-primary')}>
            {active && <motion.span layoutId="relay-mobile-active" className="absolute inset-1 rounded-lg bg-primary/10" />}
            <Icon className="relative z-10 h-5 w-5" strokeWidth={1.7} />
            <span className="relative z-10 max-w-full truncate text-[10px] font-medium">{label}</span>
        </button>
    )
}
