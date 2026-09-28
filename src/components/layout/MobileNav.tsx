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
    const half = Math.ceil(slots.length / 2)

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden" aria-label="Mobile navigation">
            <div className="pointer-events-auto relative mx-auto flex h-[66px] w-full max-w-md items-center justify-between rounded-2xl border border-border/90 bg-background/95 px-2 shadow-[0_16px_40px_-16px_hsl(var(--primary)/0.3)] backdrop-blur-xl">
                {/* Left Slots Container */}
                <div className="flex flex-1 items-center justify-around">
                    {slots.slice(0, half).map((item) => (
                        <MobileItem key={item.id} item={item} label={getModuleShortLabel(item, language, navigationConfig)} active={isActive(item)} action={() => onSelect(item)} />
                    ))}
                </div>

                {/* Center Floating Action Button (FAB) */}
                <button
                    onClick={openQuickActions}
                    aria-label={addLabel}
                    className="relative -top-3.5 z-20 shrink-0 grid h-13 w-13 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.7)] transition-transform active:scale-90"
                >
                    <Plus className="h-6 w-6" strokeWidth={2.2} />
                </button>

                {/* Right Slots Container */}
                <div className="flex flex-1 items-center justify-around">
                    {slots.slice(half).map((item) => (
                        <MobileItem key={item.id} item={item} label={getModuleShortLabel(item, language, navigationConfig)} active={isActive(item)} action={() => onSelect(item)} />
                    ))}
                    <button
                        onClick={openAllTabs}
                        aria-current={allTabsOpen ? 'page' : undefined}
                        className={cn(
                            'relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-muted-foreground transition-colors active:scale-95',
                            allTabsOpen && 'text-primary font-semibold'
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                        <span className="max-w-full truncate text-[10px] font-medium leading-tight">{allTabsLabel}</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}

function MobileItem({ item, label, active, action }: { item: ModuleDefinition; label: string; active: boolean; action: () => void }) {
    const Icon = item.icon
    return (
        <button
            onClick={action}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-muted-foreground transition-colors active:scale-95 select-none',
                active && 'text-primary font-bold'
            )}
        >
            {active && (
                <motion.span
                    layoutId="relay-mobile-active"
                    className="absolute inset-0.5 rounded-xl bg-primary/15 border border-primary/30"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
            )}
            <Icon className={cn('relative z-10 h-5 w-5 shrink-0 transition-transform', active && 'scale-105')} strokeWidth={active ? 2.2 : 1.7} />
            <span className="relative z-10 max-w-full truncate text-[10px] font-medium leading-tight tracking-tight">{label}</span>
        </button>
    )
}
