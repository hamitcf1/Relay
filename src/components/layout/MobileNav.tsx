import { LayoutDashboard, Activity, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'

interface MobileNavProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    onOpenProfile: () => void
}

export function MobileNav({ activeTab, setActiveTab, onOpenProfile }: MobileNavProps) {
    const { t } = useLanguageStore()

    const tabs = [
        {
            id: 'overview',
            label: t('module.overview') || 'Overview',
            icon: LayoutDashboard // Or Home
        },
        {
            id: 'operations',
            label: t('module.operations') || 'Operations',
            icon: Activity // Or Grid
        },
        // We can add more if needed, e.g. "Notifications" or "Search"
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 pointer-events-none">
            {/* 
                Floating Glass Container 
                pointer-events-auto is crucial because the parent is none to let clicks pass through to side areas if any 
            */}
            <div className="mx-auto max-w-sm pointer-events-auto">
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-between p-2">

                    {/* Active Tab Indicator (Optional animated background) */}
                    {/* Simplified implementation for now: plain buttons */}

                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-300",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-active"
                                        className="absolute inset-0 bg-white/5 rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className={cn("w-6 h-6 relative z-10", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")} />
                                <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
                            </button>
                        )
                    })}

                    {/* Profile / Menu Trigger */}
                    <button
                        onClick={onOpenProfile}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{t('common.profile')}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
