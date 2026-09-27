import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronLeft, Globe, LogOut, Palette, SlidersHorizontal, Sparkles } from 'lucide-react'
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RelayMark } from '@/components/brand/RelayBrand'
import { getModuleLabel, resolvePersonalNavigation } from '@/lib/navigation'
import type { ModuleDefinition } from '@/config/moduleRegistry'
import { PersonalSidebarEditor } from './PersonalSidebarEditor'

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
    const [personalizeOpen, setPersonalizeOpen] = useState(false)
    const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
    const toggleChat = useChatStore((state) => state.toggleOpen)
    const navigationConfig = useHotelStore((state) => state.hotel?.settings.navigation)
    const navigation = resolvePersonalNavigation(userRole, navigationConfig, user?.settings?.sidebar_preferences)
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
            <motion.aside initial={false} animate={{ width: sidebarCollapsed ? 72 : 248 }} className="relative z-50 hidden shrink-0 select-none flex-col border-r border-border/60 bg-gradient-to-b from-[hsl(var(--surface-deep))] via-[hsl(var(--surface-deep))/95] to-[hsl(var(--card))/80] backdrop-blur-xl md:flex">
                <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="absolute -right-3 top-[66px] z-50 grid h-6 w-6 place-items-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-md transition-transform hover:scale-110 hover:text-primary">
                    <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', sidebarCollapsed && 'rotate-180')} />
                </button>

                <div className={cn('flex h-[84px] shrink-0 items-center border-b border-border/60', sidebarCollapsed ? 'justify-center' : 'px-5')}>
                    <div className="relative flex items-center gap-2.5">
                        <RelayMark className="h-8 w-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.4)]" />
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-bold tracking-[-0.035em] bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">Relay</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                            </div>
                        )}
                    </div>
                </div>

                <nav className="custom-scrollbar flex flex-1 flex-col overflow-y-auto px-3 py-4" aria-label="Primary navigation">
                    <div className="mb-2 flex items-center justify-between gap-1">
                        {!sidebarCollapsed && <p className="px-3 text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground/80">{labels.primary}</p>}
                        <button type="button" onClick={() => setPersonalizeOpen(true)} title={language === 'tr' ? 'Yan panelimi düzenle' : 'Customize sidebar'} aria-label={language === 'tr' ? 'Yan panelimi düzenle' : 'Customize sidebar'} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors"><SlidersHorizontal className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-1">
                        {navigation.primary.map((item) => <NavItem key={item.id} item={item} label={getModuleLabel(item, language, navigationConfig)} active={isActive(item)} collapsed={sidebarCollapsed} onClick={() => navigate(item)} />)}
                    </div>

                    {navigation.primary.length > 0 && <div className="my-4 border-t border-border" />}
                    {sidebarCollapsed ? (
                        navigation.sections.flatMap((section) => section.items).map((item) => <NavItem key={item.id} item={item} label={getModuleLabel(item, language, navigationConfig)} active={isActive(item)} collapsed onClick={() => navigate(item)} />)
                    ) : (
                        <details open className="group">
                            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">
                                {labels.all}<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="mt-2 space-y-4">
                                {navigation.sections.map((section) => (
                                    <section key={section.id}>
                                        <p className="mb-1 px-3 text-[10px] font-medium text-muted-foreground/75">{section.name || section.id}</p>
                                        <div className="space-y-1">{section.items.map((item) => <NavItem key={item.id} item={item} label={getModuleLabel(item, language, navigationConfig)} active={isActive(item)} collapsed={false} onClick={() => navigate(item)} />)}</div>
                                    </section>
                                ))}
                            </div>
                        </details>
                    )}

                    <div className="mt-auto pt-4"><NavItem item={{ id: 'overview', icon: Sparkles } as ModuleDefinition} label={labels.assistant} active={false} collapsed={sidebarCollapsed} onClick={toggleChat} /></div>
                </nav>

                <div className="border-t border-border/60 p-3"><UserMenu collapsed={sidebarCollapsed} user={user} t={t} language={language} setLanguage={setLanguage} signOut={signOut} /></div>
            </motion.aside>
            <PersonalSidebarEditor open={personalizeOpen} onOpenChange={setPersonalizeOpen} />
        </TooltipProvider>
    )
}

function NavItem({ item, label, active, collapsed, onClick }: { item: ModuleDefinition; label: string; active: boolean; collapsed: boolean; onClick: () => void }) {
    const Icon = item.icon
    const content = (
        <button onClick={onClick} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground outline-none transition-all duration-200 hover:bg-muted/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60', active && 'bg-card/90 border border-primary/25 text-foreground shadow-md backdrop-blur-md shadow-primary/5 font-semibold', collapsed && 'mx-auto h-10 w-10 justify-center px-0')}>
            <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : 'group-hover:text-foreground')} />
            {!collapsed && <span className="truncate">{label}</span>}
            {active && !collapsed && <motion.span layoutId="sidebar-active" className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
        </button>
    )
    return collapsed ? <Tooltip delayDuration={0}><TooltipTrigger asChild>{content}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip> : content
}

function UserMenu({ collapsed, user, t, language, setLanguage, signOut }: any) {
    const [appearanceOpen, setAppearanceOpen] = useState(false)
    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><button className={cn('flex min-h-12 w-full items-center gap-3 rounded-lg p-2 hover:bg-muted', collapsed && 'justify-center')}><UserAvatar user={user} size="sm" />{!collapsed && <span className="min-w-0 text-left"><strong className="block truncate text-xs">{user?.name || t('common.unknown')}</strong><small className="text-muted-foreground">{user?.role}</small></span>}</button></DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="mb-2 w-64 p-2">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setAppearanceOpen(true)} className="gap-2"><Palette className="h-4 w-4 text-primary" />{t('common.appearance')}</DropdownMenuItem>
                <DropdownMenuSub><DropdownMenuSubTrigger className="gap-2"><Globe className="h-4 w-4 text-primary" />{t('common.language')}</DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent>{(['en', 'tr', 'ru'] as const).map((code) => <DropdownMenuItem key={code} onClick={() => setLanguage(code)}>{code === 'en' ? 'English' : code === 'tr' ? 'Türkçe' : 'Русский'}{language === code && <Check className="ml-auto h-3.5 w-3.5" />}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                <DropdownMenuSeparator /><DropdownMenuItem onClick={signOut} className="gap-2 text-destructive"><LogOut className="h-4 w-4" />{t('auth.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
            <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden border-border bg-card p-0 sm:max-w-md">
                <DialogHeader><DialogTitle className="px-6 pt-6">{t('common.appearance')}</DialogTitle><DialogDescription className="sr-only">Appearance and workspace settings</DialogDescription></DialogHeader>
                <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-6"><AppearanceOptions /></div>
            </DialogContent>
        </Dialog>
        </>
    )
}
