import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { 
    LayoutDashboard, 
    MessageCircle, 
    ShieldAlert, 
    CalendarDays, 
    Map as MapIcon, 
    BedDouble, 
    CreditCard,
    DollarSign,
    Users,
    Activity,
    LogOut,
    ConciergeBell,
    ChevronLeft,
    Sparkles,
    Palette,
    Globe,
    Check
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

interface AppSidebarProps {
    activeTab: string
    operationTab: string
    onNavigate: (tab: 'overview' | 'operations', subTab?: string) => void
    userRole?: string
}

export function AppSidebar({ activeTab, operationTab, onNavigate, userRole }: AppSidebarProps) {
    const { t, language, setLanguage } = useLanguageStore()
    const { user, signOut } = useAuthStore()
    const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
    const toggleChat = useChatStore(state => state.toggleOpen)

    const isOverview = activeTab === 'overview'

    const mainNavItems = [
        { id: 'overview', icon: LayoutDashboard, label: t('module.overview') || 'Overview', tab: 'overview' }
    ]

    const opsNavItems = [
        { id: 'messaging', icon: MessageCircle, label: t('module.messaging') || 'Messaging', subTab: 'messaging' },
        { id: 'feedback', icon: ShieldAlert, label: t('module.complaints') || 'Complaints', subTab: 'feedback' },
        { id: 'off-days', icon: CalendarDays, label: t('module.offDays') || 'Off Days', subTab: 'off-days' },
        { id: 'tours', icon: MapIcon, label: t('module.tours') || 'Tours', subTab: 'tours' },
        { id: 'rooms', icon: BedDouble, label: t('dashboard.rooms') || 'Rooms', subTab: 'rooms' },
        { id: 'sales', icon: CreditCard, label: t('module.sales') || 'Sales', subTab: 'sales' },
        { id: 'pricing', icon: DollarSign, label: t('module.pricing_label') || 'Pricing', subTab: 'pricing' },
        { id: 'team', icon: Users, label: t('module.team_label') || 'Team', subTab: 'team' },
    ]

    if (userRole === 'gm') {
        opsNavItems.push({ id: 'activity', icon: Activity, label: t('module.activity') || 'Activity Log', subTab: 'activity' })
    }

    const isActive = (tab: string, subTab?: string) => {
        if (tab === 'overview') return isOverview
        return activeTab === 'operations' && operationTab === subTab
    }

    const NavItem = ({ item, active, onClick }: { item: any, active: boolean, onClick: () => void }) => {
        const content = (
            <button
                onClick={onClick}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium outline-none relative group",
                    active 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    sidebarCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                )}
            >
                <item.icon className={cn("w-4 h-4 shrink-0", active && !sidebarCollapsed ? "" : active ? "text-primary-foreground" : "")} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {active && !sidebarCollapsed && item.subTab && (
                    <motion.div 
                        layoutId="sidebar-active-indicator" 
                        className="w-1.5 h-4 bg-primary-foreground/50 ml-auto rounded-full" 
                    />
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
                animate={{ width: sidebarCollapsed ? 80 : 260 }}
                className={cn(
                    "hidden md:flex flex-col bg-card/60 backdrop-blur-2xl border-r border-border/40 shrink-0 select-none z-50 relative",
                )}
            >
                {/* Collapse Toggle */}
                <button 
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-border border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm z-50"
                >
                    <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform duration-300", sidebarCollapsed && "rotate-180")} />
                </button>

                {/* Logo Area */}
                <div className={cn(
                    "h-16 flex items-center border-b border-border/40 shrink-0 transition-all duration-300",
                    sidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"
                )}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <ConciergeBell className="w-4 h-4 text-primary-foreground" />
                    </div>
                    {!sidebarCollapsed && (
                        <motion.h1 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-bold tracking-tight text-lg"
                        >
                            Aetherius <span className="text-primary font-medium tracking-normal select-text">Relay</span>
                        </motion.h1>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 flex flex-col gap-6">
                    
                    {/* Core Navigation */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 truncate">
                                {t('module.overview') || 'Dashboard'}
                            </h4>
                        )}
                        {mainNavItems.map(item => (
                            <NavItem 
                                key={item.id} 
                                item={item} 
                                active={isActive(item.tab)} 
                                onClick={() => onNavigate(item.tab as 'overview')} 
                            />
                        ))}
                    </div>

                    {/* AI Assistant - Integrated */}
                    <div className="space-y-1">
                         {!sidebarCollapsed && (
                            <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-violet-400/70 mb-2 truncate">
                                AI Hub
                            </h4>
                        )}
                        <NavItem 
                            item={{ id: 'ai-assistant', icon: Sparkles, label: 'AI Assistant' }}
                            active={false}
                            onClick={toggleChat}
                        />
                    </div>

                    {/* Operations Navigation */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 truncate">
                                {t('dashboard.operationsHub') || 'Operations'}
                            </h4>
                        )}
                        {opsNavItems.map(item => (
                            <NavItem 
                                key={item.id} 
                                item={item} 
                                active={isActive('operations', item.subTab)} 
                                onClick={() => onNavigate('operations', item.subTab)} 
                            />
                        ))}
                    </div>

                </div>

                {/* User & Settings Block */}
                <div className="p-3 border-t border-border/40 space-y-1 bg-muted/20">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 outline-none hover:bg-muted group/user",
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
                                <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-indigo-500/10">
                                    <Palette className="w-4 h-4 text-primary" />
                                    <span className="text-foreground">{t('common.appearance') || 'Appearance'}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="w-80 bg-card border-border p-4">
                                        <AppearanceOptions />
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            {/* LANGUAGE */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-indigo-500/10">
                                    <Globe className="w-4 h-4 text-primary" />
                                    <span className="text-foreground">{t('common.language') || 'Language'}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="w-40 bg-card border-border p-1">
                                        <DropdownMenuItem onClick={() => setLanguage('en')} className="text-xs">
                                            🇺🇸 English {language === 'en' && <Check className="ml-auto w-3 h-3" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setLanguage('tr')} className="text-xs">
                                            🇹🇷 Türkçe {language === 'tr' && <Check className="ml-auto w-3 h-3" />}
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
