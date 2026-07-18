import { LayoutDashboard, Activity, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useChatStore } from '@/stores/chatStore'

interface MobileNavProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    onOpenProfile: () => void
}

export function MobileNav({ activeTab, setActiveTab, onOpenProfile }: MobileNavProps) {
    const { t } = useLanguageStore()
    const toggleChat = useChatStore(state => state.toggleOpen)

    const tabs = [
        {
            id: 'overview',
            label: t('module.overview') || 'Overview',
            icon: LayoutDashboard
        },
        {
            id: 'operations',
            label: t('module.operations') || 'Operations',
            icon: Activity 
        },
        {
            id: 'ai',
            label: 'AI Chat',
            icon: Sparkles,
            action: toggleChat
        }
    ]

    return (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 md:hidden">
            {/* 
                Floating Glass Container 
                pointer-events-auto is crucial because the parent is none to let clicks pass through to side areas if any 
            */}
            <div className="mx-auto max-w-sm pointer-events-none">
                <div className="pointer-events-auto relative flex items-center justify-between rounded-[1.4rem] border-[5px] border-surface-deep bg-card/[0.88] p-1.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06),0_24px_65px_-30px_hsl(var(--foreground)/0.62)] backdrop-blur-xl">

                    {/* Active Tab Indicator (Optional animated background) */}
                    {/* Simplified implementation for now: plain buttons */}

                    {tabs.map((tab: any) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => tab.action ? tab.action() : setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] py-2 transition-[transform,color] duration-500 ease-premium active:scale-95",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-active"
                                        className="absolute inset-0 rounded-[0.9rem] bg-primary/10 ring-1 ring-primary/15"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className="relative z-10 h-5 w-5" strokeWidth={1.8} />
                                <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
                            </button>
                        )
                    })}

                    {/* Profile / Menu Trigger */}
                    <button
                        onClick={onOpenProfile}
                        className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] py-2 text-muted-foreground transition-[transform,color] duration-500 hover:text-foreground active:scale-95"
                    >
                        <User className="h-5 w-5" strokeWidth={1.8} />
                        <span className="text-[10px] font-medium">{t('common.profile')}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
