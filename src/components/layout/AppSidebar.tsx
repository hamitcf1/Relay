import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { 
    LayoutDashboard, 
    ArrowLeftRight,
    MessageCircle, 
    ShieldAlert, 
    CalendarDays, 
    Map as MapIcon, 
    CreditCard,
    DollarSign,
    Users,
    Activity,
    LogOut,
    ChevronLeft,
    Sparkles,
    Palette,
    Globe,
    Check,
    Settings,
    KeyRound,
    ClipboardCheck,
    CircleDollarSign,
    Info,
    Utensils,
    UserX,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useChatStore } from '@/stores/chatStore'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { AppearanceOptions } from '@/components/settings/AppearanceOptions'
import { RelayMark } from '@/components/brand/RelayBrand'

interface AppSidebarProps {
    activeTab: string
    operationTab: string
    overviewTab: string
    onNavigate: (tab: 'overview' | 'operations', subTab?: string) => void
    userRole?: string
}

export function AppSidebar({ activeTab, operationTab, overviewTab, onNavigate, userRole }: AppSidebarProps) {
    const { t, language, setLanguage } = useLanguageStore()
    const { user, signOut } = useAuthStore()
    const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
    const toggleChat = useChatStore(state => state.toggleOpen)

    const isOverview = activeTab === 'overview'

    const overviewNavItems = [
        { id: 'overview', icon: LayoutDashboard, label: language === 'tr' ? 'Operasyon özeti' : language === 'ru' ? 'Сводка операций' : 'Operations overview', tab: 'overview' },
        { id: 'notes', icon: ArrowLeftRight, label: language === 'tr' ? 'Vardiya devri' : language === 'ru' ? 'Передача смены' : 'Shift handover', tab: 'overview', subTab: 'notes' },
        { id: 'roster', icon: CalendarDays, label: language === 'tr' ? 'Haftalık vardiya' : language === 'ru' ? 'График на неделю' : 'Weekly roster', tab: 'overview', subTab: 'roster' },
    ]

    const operationNavItems = [
        { id: 'messaging', icon: MessageCircle, label: t('module.messaging') || 'Messaging', subTab: 'messaging' },
        { id: 'compliance', icon: Check, label: t('module.compliance') || 'Compliance', subTab: 'compliance', createdAt: '2026-05-05' },
        { id: 'feedback', icon: ShieldAlert, label: t('module.complaints') || 'Complaints', subTab: 'feedback' },
    ]

    const toolsNavItems = [
        { id: 'hotel-info', icon: Info, label: t('module.cashInfo'), tab: 'overview', subTab: 'hotel-info' },
        { id: 'currency', icon: CircleDollarSign, label: t('module.currencyConverter'), tab: 'overview', subTab: 'currency' },
        { id: 'calendar', icon: CalendarDays, label: t('module.calendar'), tab: 'overview', subTab: 'calendar' },
        { id: 'menu', icon: Utensils, label: t('menu.title'), tab: 'overview', subTab: 'menu' },
        { id: 'blacklist', icon: UserX, label: t('blacklist.title'), tab: 'overview', subTab: 'blacklist' },
    ]

    const assetNavItems = [
        { id: 'cards-loans', icon: KeyRound, label: t('module.cards-loans') || 'Cards & Loans', subTab: 'cards-loans', createdAt: '2026-05-14' },
        { id: 'pricing', icon: DollarSign, label: t('module.pricing_label') || 'Pricing', subTab: 'pricing' },
        { id: 'tours', icon: MapIcon, label: t('module.tours') || 'Tours', subTab: 'tours' },
    ]

    const teamNavItems = [
        { id: 'off-days', icon: CalendarDays, label: t('module.offDays') || 'Off Days', subTab: 'off-days' },
        { id: 'sales', icon: CreditCard, label: t('module.sales') || 'Sales', subTab: 'sales' },
        { id: 'team', icon: Users, label: t('module.team_label') || 'Team', subTab: 'team' },
    ]

    const systemNavItems: Array<Record<string, any>> = []

    if (userRole === 'gm') {
        operationNavItems.push({ id: 'attendance', icon: ClipboardCheck, label: t('module.attendance'), subTab: 'attendance', createdAt: '2026-07-18' })
        systemNavItems.push({ id: 'activity', icon: Activity, label: t('module.activity') || 'Activity Log', subTab: 'activity' })
        systemNavItems.push({ id: 'settings', icon: Settings, label: t('module.setting') || 'Hotel Settings', subTab: 'settings' })
    }

    const isActive = (tab: string, subTab?: string) => {
        if (tab === 'overview') return isOverview && (subTab ? overviewTab === subTab : overviewTab === 'grid')
        return activeTab === 'operations' && operationTab === subTab
    }

    const NavItem = ({ item, active, onClick }: { item: any, active: boolean, onClick: () => void }) => {
        const isNewFeature = (date?: string) => {
            if (!date) return false
            const created = new Date(date)
            const now = new Date()
            const diffTime = Math.abs(now.getTime() - created.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays <= 7
        }

        const content = (
            <button
                onClick={onClick}
                className={cn(
                    "group relative flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium outline-none transition-[transform,background-color,color] duration-300 ease-premium",
                    active 
                        ? "bg-white/[0.065] text-foreground before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-primary"
                        : "text-muted-foreground hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-foreground",
                    sidebarCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                )}
            >
                <div className="relative">
                    <item.icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                    {isNewFeature(item.createdAt) && sidebarCollapsed && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                </div>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && isNewFeature(item.createdAt) && (
                    <span className="ml-auto flex h-4 items-center rounded-full bg-primary/15 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                        New
                    </span>
                )}
                {active && !sidebarCollapsed && !isNewFeature(item.createdAt) && item.subTab && (
                    <motion.div layoutId="sidebar-active-indicator" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
            </button>
        )

        if (sidebarCollapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-semibold">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            )
        }

        return content
    }

    return (
        <TooltipProvider>
            <motion.aside 
                initial={false}
                animate={{ width: sidebarCollapsed ? 74 : 230 }}
                className="relative z-50 hidden shrink-0 select-none flex-col border-r border-border/80 bg-[#070a0d] md:flex"
            >
                {/* Collapse Toggle */}
                <button 
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-[66px] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-[#0d1115] text-muted-foreground shadow-sm transition-colors hover:text-primary"
                >
                    <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform duration-300", sidebarCollapsed && "rotate-180")} />
                </button>

                {/* Logo Area */}
                <div className={cn(
                    "flex h-[84px] shrink-0 items-center border-b border-border/70 transition-all duration-500",
                    sidebarCollapsed ? "justify-center px-0" : "px-5"
                )}>
                    <RelayMark className="h-8 w-8 text-primary" />
                    {!sidebarCollapsed && <span className="ml-2.5 text-xl font-semibold tracking-[-0.035em] text-foreground">Relay</span>}
                </div>

                <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
                    
                    {/* Core Navigation */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <h4 className="mb-2 truncate px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                                {t('module.overview') || 'Dashboard'}
                            </h4>
                        )}
                        {overviewNavItems.map(item => (
                            <NavItem 
                                key={item.id} 
                                item={item} 
                                active={isActive(item.tab, item.subTab)}
                                onClick={() => onNavigate(item.tab as 'overview', item.subTab)}
                            />
                        ))}
                    </div>

                    {/* Operations Navigation */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <h4 className="mb-2 truncate px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                                {t('dashboard.operationsHub') || 'Operations'}
                            </h4>
                        )}
                        {operationNavItems.map(item => (
                            <NavItem 
                                key={item.id} 
                                item={item} 
                                active={isActive('operations', item.subTab)} 
                                onClick={() => onNavigate('operations', item.subTab)} 
                            />
                        ))}
                    </div>

                    {[
                        { label: language === 'tr' ? 'Araçlar' : language === 'ru' ? 'Инструменты' : 'Tools', items: toolsNavItems },
                        { label: language === 'tr' ? 'Varlık' : language === 'ru' ? 'Активы' : 'Assets', items: assetNavItems },
                        { label: language === 'tr' ? 'Ekibim' : language === 'ru' ? 'Команда' : 'My team', items: teamNavItems },
                        { label: language === 'tr' ? 'Sistem' : language === 'ru' ? 'Система' : 'System', items: systemNavItems },
                    ].filter(group => group.items.length).map(group => (
                        <div key={group.label} className="space-y-1 border-t border-border/60 pt-4">
                            {!sidebarCollapsed && <h4 className="mb-2 px-3 text-[10px] font-medium tracking-wide text-muted-foreground">{group.label}</h4>}
                            {group.items.map(item => {
                                const targetTab = 'tab' in item && item.tab === 'overview' ? 'overview' : 'operations'
                                return <NavItem key={item.id} item={item} active={isActive(targetTab, item.subTab)} onClick={() => onNavigate(targetTab, item.subTab)} />
                            })}
                        </div>
                    ))}

                    <div className="space-y-1 border-t border-border/60 pt-4">
                        <NavItem item={{ id: 'ai-assistant', icon: Sparkles, label: 'AI Assistant' }} active={false} onClick={toggleChat} />
                    </div>

                </div>

                {/* User & Settings Block */}
                <div className="space-y-1 border-t border-border/70 bg-[#070a0d] p-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "group/user flex min-h-12 w-full items-center gap-3 rounded-[1rem] p-2 outline-none transition-colors duration-500 hover:bg-muted/70",
                                sidebarCollapsed && "justify-center"
                            )}>
                                <UserAvatar user={user} size="sm" className="shrink-0 group-hover/user:ring-2 ring-primary/20" />
                                {!sidebarCollapsed && (
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-xs font-bold text-foreground truncate w-full tracking-tight">
                                            {user?.name || t('common.unknown')}
                                        </span>
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70 truncate w-full">
                                            {user?.role}
                                        </span>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={sidebarCollapsed ? "start" : "center"} side={sidebarCollapsed ? "right" : "top"} className="w-64 bg-card border-border p-2 mb-2 ml-2">
                             <DropdownMenuLabel className="px-2 py-1.5">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground">{user?.name || t('common.unknown')}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{user?.role}</span>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator className="bg-border my-2" />

                            {/* APPEARANCE */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-primary/10">
                                    <Palette className="w-4 h-4 text-primary" />
                                    <span className="text-foreground">{t('common.appearance') || 'Appearance'}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="max-h-[calc(100dvh-1rem)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain border-border bg-card p-4">
                                        <AppearanceOptions />
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            {/* LANGUAGE */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-primary/10">
                                    <Globe className="w-4 h-4 text-primary" />
                                    <span className="text-foreground">{t('common.language') || 'Language'}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="w-40 bg-card border-border p-1">
                                        <DropdownMenuItem onClick={() => setLanguage('en')} className="text-sm cursor-pointer">
                                            English {language === 'en' && <Check className="ml-auto w-3.5 h-3.5" aria-hidden="true" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setLanguage('tr')} className="text-sm cursor-pointer">
                                            Türkçe {language === 'tr' && <Check className="ml-auto w-3.5 h-3.5" aria-hidden="true" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setLanguage('ru')} className="text-sm cursor-pointer">
                                            Русский {language === 'ru' && <Check className="ml-auto w-3.5 h-3.5" aria-hidden="true" />}
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator className="bg-border my-2" />

                            <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-rose-500 hover:text-rose-400 cursor-pointer px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors">
                                <LogOut className="w-4 h-4" />
                                <span className="text-xs font-bold">{t('auth.logout') || 'Logout'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {sidebarCollapsed && (
                         <div className="pt-2 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Relay</span>
                         </div>
                    )}
                </div>
            </motion.aside>
        </TooltipProvider>
    )
}
