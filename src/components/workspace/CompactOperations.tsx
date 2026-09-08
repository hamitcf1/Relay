import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { findModule, getConfiguredSections, getModuleLabel, resolveNavigation } from '@/lib/navigation'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'
import { DEFAULT_COMPACT_LAYOUT } from '@/lib/workspace'
import type { ModuleId } from '@/config/moduleRegistry'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModuleContent } from './ModuleContent'
import { OperationsOverview } from '@/components/dashboard/OperationsOverview'
import { cn } from '@/lib/utils'

interface CompactOperationsProps {
    activeModule: string
    onModuleChange: (id: string) => void
    onOpenShiftModule: (id: string, add?: boolean) => void
}

const COMPACT_SHIFT_IDS = new Set([...DEFAULT_COMPACT_LAYOUT.left, ...DEFAULT_COMPACT_LAYOUT.right])

export function CompactOperations({ activeModule, onModuleChange, onOpenShiftModule }: CompactOperationsProps) {
    const user = useAuthStore((state) => state.user)
    const hotel = useHotelStore((state) => state.hotel)
    const { language } = useLanguageStore()
    const isMobile = useIsMobile()
    const [railCollapsed, setRailCollapsed] = useState(false)
    const [selectorOpen, setSelectorOpen] = useState(false)
    const modules = useMemo(() => {
        const config = normalizeNavigationConfig(hotel?.settings.navigation)
        const allowed = new Map(resolveNavigation(user?.role, hotel?.settings.navigation).all.map((item) => [item.id, item]))
        const order = getConfiguredSections(config, user?.role).flatMap((section) => section.moduleIds)
        return [findModule('overview')!, ...order.filter((id) => id !== 'overview' && !COMPACT_SHIFT_IDS.has(id)).map((id) => allowed.get(id as ModuleId)).filter(Boolean)]
    }, [hotel?.settings.navigation, user?.role])
    const permittedIds = new Set(modules.map((module) => module!.id))
    const selected = permittedIds.has(activeModule as ModuleId) ? activeModule as ModuleId : 'overview'
    const selectedDefinition = findModule(selected) || findModule('overview')!
    const copy = language === 'tr'
        ? { choose: 'Operasyon modülü seç', selector: 'Operasyon araçları', expand: 'Operasyon menüsünü genişlet', collapse: 'Operasyon menüsünü daralt' }
        : language === 'ru'
            ? { choose: 'Выбрать модуль', selector: 'Инструменты операций', expand: 'Развернуть меню операций', collapse: 'Свернуть меню операций' }
            : { choose: 'Choose operations module', selector: 'Operations tools', expand: 'Expand operations navigation', collapse: 'Collapse operations navigation' }

    const choose = (id: string) => { onModuleChange(id); setSelectorOpen(false) }
    const content = selected === 'overview'
        ? <OperationsOverview onOpenNotes={() => onOpenShiftModule('notes')} onNewRecord={() => onOpenShiftModule('notes', true)} onOpenSales={() => onModuleChange('sales')} />
        : <ModuleContent moduleId={selected} hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} />

    return (
        <div data-testid="compact-operations" className="flex h-full min-h-0">
            <aside className={cn('hidden shrink-0 border-r border-border bg-card/35 p-2 transition-[width] md:block', railCollapsed ? 'w-14' : 'w-56')}>
                <button onClick={() => setRailCollapsed((value) => !value)} aria-label={railCollapsed ? copy.expand : copy.collapse} className="mb-2 grid h-9 w-full place-items-center rounded-lg text-muted-foreground hover:bg-muted">{railCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
                <div className="space-y-1">{modules.map((module) => { if (!module) return null; const Icon = module.icon; const label = getModuleLabel(module, language); return <button key={module.id} title={label} onClick={() => choose(module.id)} aria-current={selected === module.id ? 'page' : undefined} className={cn('flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted', selected === module.id && 'bg-primary/10 text-primary', railCollapsed && 'justify-center px-0')}><Icon className="h-4 w-4 shrink-0" />{!railCollapsed && <span className="truncate">{label}</span>}</button> })}</div>
            </aside>
            <section className="min-w-0 flex-1 overflow-y-auto pb-28 md:pb-6">
                {isMobile && <div className="sticky top-0 z-30 border-b border-border bg-background/90 p-3 backdrop-blur"><button onClick={() => setSelectorOpen(true)} aria-haspopup="dialog" aria-expanded={selectorOpen} className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-sm font-semibold"><span>{getModuleLabel(selectedDefinition, language)}</span><ChevronDown className="h-4 w-4" /></button></div>}
                <div className="p-4 md:p-6">{content}</div>
            </section>
            <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}><DialogContent className="top-auto bottom-0 translate-y-0 rounded-b-none rounded-t-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"><DialogHeader><DialogTitle>{copy.selector}</DialogTitle><DialogDescription className="sr-only">{copy.choose}</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-2">{modules.map((module) => { if (!module) return null; const Icon = module.icon; return <button key={module.id} onClick={() => choose(module.id)} className={cn('flex min-h-14 items-center gap-3 rounded-xl border border-border px-3 text-left text-sm', selected === module.id && 'border-primary bg-primary/10 text-primary')}><Icon className="h-4 w-4" />{getModuleLabel(module, language)}</button> })}</div></DialogContent></Dialog>
        </div>
    )
}
