import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronLeft, Globe, LogOut, Palette, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useChatStore } from '@/stores/chatStore'
import { useHotelStore } from '@/stores/hotelStore'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub,
    DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppearanceOptions } from '@/components/settings/AppearanceOptions'
import { RelayMark } from '@/components/brand/RelayBrand'
import { getModuleLabel, resolveNavigation } from '@/lib/navigation'
import type { ModuleDefinition } from '@/config/moduleRegistry'

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
    const toggleChat = useChatStore((state) => state.toggleOpen)
    const navigationConfig = useHotelStore((state) => state.hotel?.settings.navigation)
    const navigation = resolveNavigation(userRole, navigationConfig)
    const labels = language === 'tr'
        ? { primary: 'Çalışma alanı', all: 'Tüm araçlar', assistant: 'AI Asistan' }
        : language === 'ru'
            ? { primary: 'Рабочая область', all: 'Все инструменты', assistant: 'AI Ассистент' }
            : { primary: 'Workspace', all: 'All tools', assistant: 'AI Assistant' }

    const isActive = (item: ModuleDefinition) => item.area === 'overview'
        ? activeTab === 'overview' && (item.subTab ? overviewTab === item.subTab : overviewTab === 'grid')
        : activeTab === 'operations' && operationTab === item.subTab
    const navigate = (item: ModuleDefinition) => onNavigate(item.area, item.subTab)

    return (
        <TooltipProvider>
            <motion.aside initial={false} animate={{ width: sidebarCollapsed ? 72 : 248 }} className="relative z-50 hidden shrink-0 select-none flex-col border-r border-border bg-[hsl(var(--surface-deep))] md:flex">
                <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="absolute -right-3 top-[66px] z-50 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-primary">
                    <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', sidebarCollapsed && 'rotate-180')} />
                </button>

                <div className={cn('flex h-[84px] shrink-0 items-center border-b border-border', sidebarCollapsed ? 'justify-center' : 'px-5')}>
                    <RelayMark className="h-8 w-8 text-primary" />
                    {!sidebarCollapsed && <span className="ml-2.5 text-xl font-semibold tracking-[-0.035em]">Relay</span>}
                </div>

                <nav className="custom-scrollbar flex flex-1 flex-col overflow-y-auto px-3 py-4" aria-label="Primary navigation">
                    {!sidebarCollapsed && <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">{labels.primary}</p>}
                    <div className="space-y-1">
                        {navigation.primary.map((item) => <NavItem key={item.id} item={item} label={getModuleLabel(item, language)} active={isActive(item)} collapsed={sidebarCollapsed} onClick={() => navigate(item)} />)}
                    </div>

                    <div className="my-4 border-t border-border" />
                    {sidebarCollapsed ? (
                        navigation.sections.flatMap((section) => section.items).map((item) => <NavItem key={item.id} item={item} label={getModuleLabel(item, language)} active={isActive(item)} collapsed onClick={() => navigate(item)} />)
                    ) : (
                        <details open className="group">
                            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">
                                {labels.all}<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="mt-2 space-y-4">
                                {navigation.sections.map((section) => (
                                    <section key={section.id}>
                                        <p className="mb-1 px-3 text-[10px] font-medium text-muted-foreground/75">{section.name || section.id}</p>
                                        <div className="space-y-1">{section.items.map((item) => <NavItem key={item.id} item={item} label={getModuleLabel(item, language)} active={isActive(item)} collapsed={false} onClick={() => navigate(item)} />)}</div>
                                    </section>
                                ))}
                            </div>
                        </details>
                    )}

                    <div className="mt-auto pt-4"><NavItem item={{ id: 'overview', icon: Sparkles } as ModuleDefinition} label={labels.assistant} active={false} collapsed={sidebarCollapsed} onClick={toggleChat} /></div>
                </nav>

                <div className="border-t border-border p-3"><UserMenu collapsed={sidebarCollapsed} user={user} t={t} language={language} setLanguage={setLanguage} signOut={signOut} /></div>
            </motion.aside>
        </TooltipProvider>
    )
}

function NavItem({ item, label, active, collapsed, onClick }: { item: ModuleDefinition; label: string; active: boolean; collapsed: boolean; onClick: () => void }) {
    const Icon = item.icon
    const content = (
        <button onClick={onClick} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60', active && 'bg-card text-foreground shadow-sm', collapsed && 'mx-auto h-10 w-10 justify-center px-0')}>
            <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
            {!collapsed && <span className="truncate">{label}</span>}
            {active && !collapsed && <motion.span layoutId="sidebar-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
    )
    return collapsed ? <Tooltip delayDuration={0}><TooltipTrigger asChild>{content}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip> : content
}

function UserMenu({ collapsed, user, t, language, setLanguage, signOut }: any) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild><button className={cn('flex min-h-12 w-full items-center gap-3 rounded-lg p-2 hover:bg-muted', collapsed && 'justify-center')}><UserAvatar user={user} size="sm" />{!collapsed && <span className="min-w-0 text-left"><strong className="block truncate text-xs">{user?.name || t('common.unknown')}</strong><small className="text-muted-foreground">{user?.role}</small></span>}</button></DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="mb-2 w-64 p-2">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuSub><DropdownMenuSubTrigger className="gap-2"><Palette className="h-4 w-4 text-primary" />{t('common.appearance')}</DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent className="max-h-[calc(100dvh-1rem)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto p-4"><AppearanceOptions /></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                <DropdownMenuSub><DropdownMenuSubTrigger className="gap-2"><Globe className="h-4 w-4 text-primary" />{t('common.language')}</DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent>{(['en', 'tr', 'ru'] as const).map((code) => <DropdownMenuItem key={code} onClick={() => setLanguage(code)}>{code === 'en' ? 'English' : code === 'tr' ? 'Türkçe' : 'Русский'}{language === code && <Check className="ml-auto h-3.5 w-3.5" />}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                <DropdownMenuSeparator /><DropdownMenuItem onClick={signOut} className="gap-2 text-destructive"><LogOut className="h-4 w-4" />{t('auth.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
