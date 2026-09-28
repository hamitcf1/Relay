import { useEffect, useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock as ClockIcon, EyeOff, MoonStar, Search, SunMedium } from 'lucide-react'

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { AnnouncementModal } from '@/components/messaging/AnnouncementModal'

import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { useShiftAutomator } from '@/hooks/useShiftAutomator'
import { useDuePaymentNotifier } from '@/hooks/useDuePaymentNotifier'
import { AnnouncementBanner } from '@/components/announcements/AnnouncementBanner'
import { TourOverlay } from '@/components/onboarding/TourOverlay'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { OfficialRecordModal } from '@/components/incidents/OfficialRecordModal'

import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useNotesStore } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useSalesStore } from '@/stores/salesStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useStaffMealStore } from '@/stores/staffMealStore'
import { useBlacklistStore } from '@/stores/blacklistStore'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { DateTimeWidget } from '@/components/layout/DateTimeWidget'
import { MobileNav } from '@/components/layout/MobileNav'
import { AllTabsDirectory } from '@/components/layout/AllTabsDirectory'
import { QuickActionMenu } from '@/components/layout/QuickActionMenu'
import type { ModuleDefinition } from '@/config/moduleRegistry'
import { OperationsGrid } from '@/components/dashboard/OperationsGrid'
import { OperationsOverview } from '@/components/dashboard/OperationsOverview'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { ShiftTimer } from '@/components/layout/ShiftTimer'
import { RelayMark } from '@/components/brand/RelayBrand'
import { ModulePageSurface } from '@/components/layout/ModulePageSurface'
import { CompactShift } from '@/components/workspace/CompactShift'
import { CompactNavigation, type CompactArea } from '@/components/workspace/CompactNavigation'
import { CompactOperations } from '@/components/workspace/CompactOperations'
import { normalizeWorkspaceMode, resolveWorkspaceTarget } from '@/lib/workspace'
import { UserNav } from '@/components/layout/UserNav'
import { ModuleContent } from '@/components/workspace/ModuleContent'
import type { ModuleId } from '@/config/moduleRegistry'
import { useWorkspaceEditStore } from '@/stores/workspaceEditStore'
import { toast } from 'sonner'

export function DashboardPage() {
    const location = useLocation()
    const navigate = useNavigate()

    const initialParams = new URLSearchParams(location.search)
    const initialTabParam = initialParams.get('tab')
    const initialChatParam = initialParams.get('chat')

    const user = useAuthStore((state) => state.user)
    const initAuth = useAuthStore((state) => state.initialize)
    const hotel = useHotelStore((state) => state.hotel)
    const subscribeToHotel = useHotelStore((state) => state.subscribeToHotel)
    const currentShift = useShiftStore((state) => state.currentShift)
    const subscribeToCurrentShift = useShiftStore((state) => state.subscribeToCurrentShift)
    const schedule = useRosterStore((state) => state.schedule)
    const subscribeToRoster = useRosterStore((state) => state.subscribeToRoster)
    const subscribeToNotes = useNotesStore((state) => state.subscribeToNotes)
    const subscribeToTodayMenu = useStaffMealStore((state) => state.subscribeToTodayMenu)
    const { t, language } = useLanguageStore()

    const [showTour, setShowTour] = useState(false)
    const [activeTab, setActiveTab] = useState(() => (location.pathname === '/operations' ? 'operations' : 'overview'))
    const [operationTab, setOperationTab] = useState(() => {
        if (location.pathname === '/operations') {
            if (initialTabParam) return initialTabParam
            if (initialChatParam) return 'messaging'
        }
        return 'messaging'
    })
    const [overviewTab, setOverviewTab] = useState(() => {
        if (location.pathname === '/dashboard' || location.pathname === '/') {
            if (initialTabParam) return initialTabParam
        }
        return 'grid'
    })
    const [openNewNote, setOpenNewNote] = useState(false)
    const workspaceMode = normalizeWorkspaceMode(user?.settings?.workspace_mode)
    const [compactArea, setCompactArea] = useState<CompactArea>('shift')
    const [compactOperationTab, setCompactOperationTab] = useState(user?.settings?.compact_operation_tab || 'overview')
    const [compactShiftTarget, setCompactShiftTarget] = useState<string | null>(null)
    const [compactNoteComposerOpen, setCompactNoteComposerOpen] = useState(false)
    const [lastCompactShiftModule, setLastCompactShiftModule] = useState('overview')
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
    const [officialRecordOpen, setOfficialRecordOpen] = useState(false)
    const previousWorkspaceMode = useRef(workspaceMode)
    const previousUserId = useRef(user?.uid)
    const clearWorkspaceEdits = useWorkspaceEditStore((state) => state.clear)

    // Mobile Detection
    const isMobile = useIsMobile()

    const [showDateTime, setShowDateTime] = useState(() => {
        const saved = localStorage.getItem('relay_show_datetime')
        return saved !== 'false' // default: true
    })

    // Unified navigation state and browser URL synchronizer
    const updateNavigationState = (area: 'overview' | 'operations', subTab?: string, options?: { replace?: boolean }) => {
        setActiveTab(area)
        const targetSubTab = subTab || (area === 'overview' ? 'grid' : 'messaging')

        if (area === 'overview') {
            if (subTab === 'notes') setOpenNewNote(false)
            setOverviewTab(targetSubTab)
        } else {
            setOperationTab(targetSubTab)
        }

        const targetPath = area === 'operations' ? '/operations' : '/dashboard'
        const search = targetSubTab && targetSubTab !== 'grid' ? `?tab=${targetSubTab}` : ''
        const newUrl = `${targetPath}${search}`
        const currentUrl = `${location.pathname}${location.search}`

        if (newUrl !== currentUrl) {
            navigate(newUrl, { replace: options?.replace ?? true })
        }
    }

    // Global Ctrl+K / Cmd+K Command Palette Shortcut Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
                e.preventDefault()
                setCommandPaletteOpen(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [])

    // Persist showDateTime changes to localStorage
    useEffect(() => {
        localStorage.setItem('relay_show_datetime', String(showDateTime))
    }, [showDateTime])

    // Update activeTab when location changes (e.g. via navigate('/operations') or browser refresh)
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const tabParam = searchParams.get('tab')
        const chatParam = searchParams.get('chat')

        if (workspaceMode === 'compact') {
            if (tabParam) {
                const target = resolveWorkspaceTarget(tabParam, 'compact')
                setCompactArea(target.area)
                if (target.area === 'shift') {
                    setCompactShiftTarget(target.moduleId)
                    setLastCompactShiftModule(target.moduleId)
                }
                else setCompactOperationTab(target.moduleId)
            } else if (location.pathname === '/operations') {
                setCompactArea('operations')
                setCompactOperationTab(chatParam ? 'messaging' : 'overview')
            } else {
                setCompactArea('shift')
            }
            return
        }

        if (location.pathname === '/operations') {
            setActiveTab('operations')
            if (tabParam) {
                setOperationTab(tabParam)
            } else if (chatParam) {
                setOperationTab('messaging')
            }
        } else if (location.pathname === '/dashboard' || location.pathname === '/') {
            setActiveTab('overview')
            if (tabParam) {
                setOverviewTab(tabParam)
            } else {
                setOverviewTab('grid')
            }
        }
    }, [location.pathname, location.search, workspaceMode])

    useEffect(() => {
        if (previousWorkspaceMode.current === workspaceMode) return
        if (workspaceMode === 'compact') {
            if (activeTab === 'operations') {
                setCompactArea('operations')
                setCompactOperationTab(operationTab === 'grid' ? 'overview' : operationTab)
            } else {
                setCompactArea('shift')
                if (overviewTab !== 'grid') {
                    setCompactShiftTarget(overviewTab)
                    setLastCompactShiftModule(overviewTab)
                }
            }
        } else if (compactArea === 'operations') {
            if (compactOperationTab === 'overview') {
                setActiveTab('overview')
                setOverviewTab('grid')
            } else {
                setActiveTab('operations')
                setOperationTab(compactOperationTab)
            }
        } else {
            setActiveTab('overview')
            setOverviewTab(lastCompactShiftModule === 'overview' ? 'grid' : lastCompactShiftModule)
        }
        previousWorkspaceMode.current = workspaceMode
    }, [activeTab, compactArea, compactOperationTab, lastCompactShiftModule, operationTab, overviewTab, workspaceMode])

    useEffect(() => {
        if (previousUserId.current === user?.uid) return
        clearWorkspaceEdits()
        setActiveTab('overview')
        setOperationTab('messaging')
        setOverviewTab('grid')
        setCompactArea('shift')
        setCompactOperationTab(user?.settings?.compact_operation_tab || 'overview')
        setCompactShiftTarget(null)
        setLastCompactShiftModule('overview')
        previousWorkspaceMode.current = workspaceMode
        previousUserId.current = user?.uid
    }, [clearWorkspaceEdits, user?.settings?.compact_operation_tab, user?.uid, workspaceMode])

    // Automate shifts
    useShiftAutomator(hotel?.id || null)

    // Due payment notifier
    useDuePaymentNotifier()

    // Subscribe to sales for dashboard visibility
    const { subscribeToSales } = useSalesStore()

    useEffect(() => {
        if (!hotel?.id) return
        const unsubSales = subscribeToSales(hotel.id)
        return () => {
            unsubSales()
        }
    }, [hotel?.id, subscribeToSales])

    // Initialize auth listener
    useEffect(() => {
        const unsubscribe = initAuth()
        return () => unsubscribe()
    }, [initAuth])

    // Get user's hotel and set up subscription
    const userHotelId = user?.hotel_id

    useEffect(() => {
        if (!userHotelId) {
            return
        }

        const unsubHotel = subscribeToHotel(userHotelId)
        const unsubShift = subscribeToCurrentShift(userHotelId)
        const unsubNotes = subscribeToNotes(userHotelId)
        const unsubRoster = subscribeToRoster(userHotelId)
        const unsubMenu = subscribeToTodayMenu(userHotelId)
        const subscribeToBlacklist = useBlacklistStore.getState().subscribeToBlacklist
        const unsubBlacklist = subscribeToBlacklist(userHotelId)

        return () => {
            unsubHotel()
            unsubShift()
            unsubNotes()
            unsubRoster()
            unsubMenu()
            unsubBlacklist()
        }
    }, [userHotelId, subscribeToHotel, subscribeToCurrentShift, subscribeToNotes, subscribeToRoster, subscribeToTodayMenu])

    const [showTutorial, setShowTutorial] = useState(false)

    const handleModuleSelect = (item: ModuleDefinition) => {
        updateNavigationState(item.area, item.subTab)
    }

    const handleQuickAction = (id: 'notes' | 'feedback' | 'sales' | 'messaging' | 'calendar') => {
        if (workspaceMode === 'compact') {
            if (id === 'notes' || id === 'calendar') {
                setCompactArea('shift')
                setCompactShiftTarget(id)
                setLastCompactShiftModule(id)
                if (id === 'notes') setCompactNoteComposerOpen(true)
                return
            }
            setCompactArea('operations')
            setCompactOperationTab(id)
            return
        }
        if (id === 'notes') {
            setOpenNewNote(true)
            updateNavigationState('overview', 'notes')
            return
        }
        if (id === 'calendar') {
            updateNavigationState('overview', 'calendar')
            return
        }
        updateNavigationState('operations', id)
    }

    const openCompactShiftModule = (id: string, add = false) => {
        setCompactArea('shift')
        setCompactShiftTarget(id)
        setLastCompactShiftModule(id)
        if (id === 'notes' && add) setCompactNoteComposerOpen(true)
    }

    const selectCompactOperation = async (id: string) => {
        setCompactOperationTab(id)
        try {
            await useAuthStore.getState().updateSettings({ compact_operation_tab: id })
        } catch {
            toast.error(language === 'tr' ? 'Operasyon tercihi kaydedilemedi' : language === 'ru' ? 'Не удалось сохранить выбор операции' : 'Could not save operations preference')
        }
    }

    const rosterShift = user ? schedule[user.uid]?.[format(new Date(), 'yyyy-MM-dd')] : undefined
    const inferredShift = new Date().getHours() >= 16 ? 'B' : new Date().getHours() < 8 ? 'C' : 'A'
    const activeShiftCode = currentShift?.type || (rosterShift && rosterShift !== 'OFF' ? rosterShift : inferredShift)
    const configuredShift = hotel?.settings?.shifts?.find((shift) => shift.code === activeShiftCode)
    const fallbackShiftTimes: Record<string, [string, string]> = { A: ['08:00', '16:00'], B: ['16:00', '00:00'], C: ['00:00', '08:00'], E: ['10:00', '18:00'] }
    const shiftTimes = fallbackShiftTimes[activeShiftCode] || fallbackShiftTimes.A
    const shiftName = configuredShift?.name || (language === 'tr'
        ? ({ A: 'Gündüz', B: 'Akşam', C: 'Gece', E: 'Ara vardiya' }[activeShiftCode] || 'Vardiya')
        : language === 'ru'
            ? ({ A: 'День', B: 'Вечер', C: 'Ночь', E: 'Средняя смена' }[activeShiftCode] || 'Смена')
            : ({ A: 'Day shift', B: 'Evening', C: 'Night', E: 'Mid shift' }[activeShiftCode] || 'Shift'))
    const shiftStart = configuredShift?.startTime || shiftTimes[0]
    const shiftEnd = configuredShift?.endTime || shiftTimes[1]

    return (
        <div className="relay-app h-[100dvh] overflow-hidden bg-background text-foreground flex font-sans selection:bg-primary/30 relative">

            <OnboardingWizard forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <TourOverlay isOpen={showTour} onClose={() => setShowTour(false)} />

            {/* Application Sidebar (Desktop only) */}
            {workspaceMode === 'compact' ? <CompactNavigation area={compactArea} onAreaChange={setCompactArea} /> : <AppSidebar
                activeTab={activeTab}
                operationTab={operationTab}
                overviewTab={overviewTab}
                userRole={user?.role}
                onNavigate={(tab, subTab) => {
                    updateNavigationState(tab, subTab)
                }}
            />}

            {/* Main Content Pane */}
            <div className="flex flex-col flex-1 relative min-w-0 overflow-hidden">
                <header className="relay-commandbar safe-header relative z-40 flex h-[72px] shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-5 backdrop-blur-xl md:px-7">
                    <div className="flex items-center md:hidden">
                        <RelayMark className="h-9 w-9 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
                    </div>

                    <div className="relay-mobile-shift md:hidden">
                        {activeShiftCode === 'C' || activeShiftCode === 'B' ? <MoonStar /> : <SunMedium />}
                        <span><strong>{shiftName}</strong><small>{shiftStart}–{shiftEnd}</small></span>
                    </div>

                    <label onClick={() => setCommandPaletteOpen(true)} className="relay-command-search hidden h-10 w-full max-w-[440px] items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 text-muted-foreground md:flex cursor-pointer hover:border-primary/40 hover:bg-card/90 transition-all shadow-xs backdrop-blur-md">
                        <Search className="h-4 w-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" />
                        <input aria-label={t('common.search') as string} placeholder="Hızlı komut veya arama yapın (⌘K)..." readOnly className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer placeholder:text-muted-foreground/80" />
                        <kbd className="rounded-md border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground bg-muted/80 font-mono shadow-2xs">⌘K</kbd>
                    </label>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-1 sm:mr-2 scale-90 sm:scale-100 origin-right">
                            <div className="hidden md:block"><ShiftTimer /></div>
                        </div>
                        <AnimatePresence>
                            {showDateTime && (
                                <div className="hidden lg:block">
                                    <DateTimeWidget />
                                </div>
                            )}
                        </AnimatePresence>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex"
                            onClick={() => setShowDateTime(!showDateTime)}
                            title={showDateTime ? "Hide Time" : "Show Time"}
                        >
                            {showDateTime ? <EyeOff className="w-3.5 h-3.5" /> : <ClockIcon className="w-3.5 h-3.5" />}
                        </Button>
                        <div id="tour-notifications">
                            <NotificationDropdown />
                        </div>
                        {workspaceMode === 'modern' && <div className="md:hidden"><UserNav /></div>}
                    </div>
                </header>

            <main className={cn('relay-scroll-root relative min-h-0 flex-1', workspaceMode === 'compact' ? 'overflow-hidden' : 'overflow-y-auto pb-28 md:pb-8')}>
                {workspaceMode === 'compact' ? (compactArea === 'shift' ? <CompactShift focusModule={compactShiftTarget} initialAddOpen={compactNoteComposerOpen} onFocusHandled={() => { setCompactShiftTarget(null); setCompactNoteComposerOpen(false) }} onModuleFocus={setLastCompactShiftModule} /> : <CompactOperations activeModule={compactOperationTab} onModuleChange={(id) => { void selectCompactOperation(id) }} onOpenShiftModule={openCompactShiftModule} />) : (
                <div className="relay-page">
                <AnnouncementBanner />
                
                <Tabs value={activeTab} className="border-none p-0 bg-transparent shadow-none">
                    
                    {/* OVERVIEW VIEW */}
                    <TabsContent value="overview" className="m-0 border-none p-0 outline-none">
                        {overviewTab === 'grid' ? (
                            <OperationsOverview
                                onOpenNotes={() => {
                                    setOpenNewNote(false)
                                    updateNavigationState('overview', 'notes')
                                }}
                                onNewRecord={() => {
                                    setOpenNewNote(true)
                                    updateNavigationState('overview', 'notes')
                                }}
                                onOpenSales={() => {
                                    updateNavigationState('operations', 'sales')
                                }}
                            />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                                className="w-full"
                            >
                                <ModulePageSurface wide data-testid="modern-module-surface" className="h-[calc(100dvh-4.5rem)] md:h-[calc(100dvh-7rem)] min-h-0 overflow-y-auto overscroll-contain">
                                    <ModuleContent moduleId={overviewTab as ModuleId} hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} initialAddOpen={openNewNote} />
                                </ModulePageSurface>
                            </motion.div>
                        )}
                        <ScrollToTopButton />
                        </TabsContent>

                        {/* OPERATIONS VIEW */}
                        <TabsContent value="operations" className="m-0 border-none p-0 outline-none">
                            <Tabs value={operationTab} onValueChange={(val) => updateNavigationState('operations', val)}>
                                <div>
                                    {isMobile && operationTab === 'grid' && (
                                        <OperationsGrid
                                            onSelect={(id) => {
                                                if (id === 'overview') {
                                                    updateNavigationState('overview', 'grid')
                                                    return
                                                }
                                                if (['hotel-info', 'currency', 'calendar', 'menu', 'blacklist'].includes(id)) {
                                                    updateNavigationState('overview', id)
                                                    return
                                                }
                                                updateNavigationState('operations', id)
                                            }}
                                            userRole={user?.role}
                                        />
                                    )}

                                    {operationTab !== 'grid' && <div className="block">
                                        <ModulePageSurface wide data-testid="modern-module-surface" className="h-[calc(100dvh-4.5rem)] md:h-[calc(100dvh-7rem)] min-h-0 overflow-y-auto overscroll-contain">
                                            <ModuleContent moduleId={operationTab as ModuleId} hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />
                                        </ModulePageSurface>
                                        <ScrollToTopButton />
                                    </div>}
                                </div>
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                </div>
                )}
                </main>
            </div>

            {/* Mobile Bottom Navigation Layout stays consistent */}
            {workspaceMode === 'modern' && <MobileNav
                activeTab={activeTab}
                overviewTab={overviewTab}
                operationTab={operationTab}
                userRole={user?.role}
                onSelect={handleModuleSelect}
            />}
            {workspaceMode === 'modern' && <AllTabsDirectory role={user?.role} onSelect={handleModuleSelect} />}
            <QuickActionMenu onAction={handleQuickAction} />
            <AnnouncementModal />

            <CommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                onOpen={() => setCommandPaletteOpen(true)}
                onNavigateTab={(tabId) => {
                    updateNavigationState('operations', tabId)
                }}
                onOpenNewSale={() => {
                    updateNavigationState('operations', 'sales')
                }}
                onOpenNewNote={() => {
                    setOpenNewNote(true)
                    updateNavigationState('overview', 'notes')
                }}
                onOpenOfficialRecord={() => setOfficialRecordOpen(true)}
            />

            <OfficialRecordModal
                isOpen={officialRecordOpen}
                onClose={() => setOfficialRecordOpen(false)}
            />
        </div>
    )
}
