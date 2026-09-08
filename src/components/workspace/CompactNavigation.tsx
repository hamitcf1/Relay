import { Activity, ArrowLeftRight, Plus, Sparkles } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLanguageStore } from '@/stores/languageStore'
import { RelayMark } from '@/components/brand/RelayBrand'
import { UserNav } from '@/components/layout/UserNav'
import { cn } from '@/lib/utils'

export type CompactArea = 'shift' | 'operations'

export function CompactNavigation({ area, onAreaChange }: { area: CompactArea; onAreaChange: (area: CompactArea) => void }) {
    const toggleChat = useChatStore((state) => state.toggleOpen)
    const openQuickActions = useNavigationStore((state) => state.openQuickActions)
    const { language } = useLanguageStore()
    const labels = language === 'tr' ? { shift: 'Vardiya', operations: 'Operasyon', assistant: 'AI Asistan', quick: 'Hızlı kayıt' }
        : language === 'ru' ? { shift: 'Смена', operations: 'Операции', assistant: 'AI Ассистент', quick: 'Быстрое действие' }
            : { shift: 'Shift', operations: 'Operations', assistant: 'AI Assistant', quick: 'Quick action' }
    const items = [
        { id: 'shift' as const, icon: ArrowLeftRight, label: labels.shift },
        { id: 'operations' as const, icon: Activity, label: labels.operations },
    ]

    return <>
        <aside data-testid="compact-desktop-nav" className="relative z-50 hidden w-[220px] shrink-0 flex-col border-r border-border bg-[hsl(var(--surface-deep))] md:flex">
            <div className="flex h-[84px] items-center border-b border-border px-5"><RelayMark className="h-8 w-8 text-primary" /><span className="ml-2.5 text-xl font-semibold">Relay</span></div>
            <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Compact workspace">
                {items.map(({ id, icon: Icon, label }) => <button key={id} onClick={() => onAreaChange(id)} aria-current={area === id ? 'page' : undefined} className={cn('flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground', area === id && 'bg-card text-foreground shadow-sm')}><Icon className={cn('h-4 w-4', area === id && 'text-primary')} />{label}</button>)}
                <button onClick={toggleChat} className="mt-3 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><Sparkles className="h-4 w-4 text-primary" />{labels.assistant}</button>
                <div className="mt-auto"><UserNav /></div>
            </nav>
        </aside>

        <button onClick={openQuickActions} aria-label={labels.quick} className="fixed bottom-[88px] right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl md:bottom-6 md:right-6"><Plus className="h-6 w-6" /></button>
        <nav data-testid="compact-mobile-nav" className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+6px)] z-50 grid h-[70px] grid-cols-4 rounded-2xl border border-border bg-background/95 p-1 shadow-xl backdrop-blur md:hidden" aria-label="Compact mobile navigation">
            {items.map(({ id, icon: Icon, label }) => <button key={id} onClick={() => onAreaChange(id)} aria-current={area === id ? 'page' : undefined} className={cn('flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground', area === id && 'bg-primary/10 text-primary')}><Icon className="h-5 w-5" /><span className="text-[10px] font-medium">{label}</span></button>)}
            <button onClick={toggleChat} className="flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground"><Sparkles className="h-5 w-5" /><span className="text-[10px] font-medium">AI</span></button>
            <UserNav variant="mobile-nav" />
        </nav>
    </>
}
