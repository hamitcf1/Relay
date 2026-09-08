import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { resolveNavigation, getModuleLabel } from '@/lib/navigation'
import type { ModuleDefinition } from '@/config/moduleRegistry'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { cn } from '@/lib/utils'
import { useHotelStore } from '@/stores/hotelStore'

interface AllTabsDirectoryProps {
    role?: string
    onSelect: (item: ModuleDefinition) => void
}

export function AllTabsDirectory({ role, onSelect }: AllTabsDirectoryProps) {
    const { allTabsOpen, closeAllTabs } = useNavigationStore()
    const { language } = useLanguageStore()
    const [query, setQuery] = useState('')
    const navigationConfig = useHotelStore((state) => state.hotel?.settings.navigation)
    const navigation = useMemo(() => resolveNavigation(role, navigationConfig), [role, navigationConfig])
    const copy = language === 'tr'
        ? { title: 'Tüm sekmeler', search: 'Sekme ara…', empty: 'Eşleşen sekme yok', groups: { today: 'Bugün', operations: 'Operasyon', tools: 'Araçlar', management: 'Yönetim' } }
        : language === 'ru'
            ? { title: 'Все разделы', search: 'Поиск…', empty: 'Ничего не найдено', groups: { today: 'Сегодня', operations: 'Операции', tools: 'Инструменты', management: 'Управление' } }
            : { title: 'All tabs', search: 'Search tabs…', empty: 'No matching tabs', groups: { today: 'Today', operations: 'Operations', tools: 'Tools', management: 'Management' } }
    const normalized = query.trim().toLocaleLowerCase(language)
    const sections = navigation.sections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => getModuleLabel(item, language).toLocaleLowerCase(language).includes(normalized)),
        }))
        .filter((section) => section.items.length)

    if (!allTabsOpen) return null

    return (
        <section className="fixed inset-0 z-[80] flex flex-col bg-background md:hidden" aria-label={copy.title}>
            <header className="safe-header flex items-center justify-between border-b border-border px-4">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Relay</p>
                    <h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
                </div>
                <button onClick={closeAllTabs} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="h-5 w-5" />
                </button>
            </header>
            <div className="border-b border-border/70 p-4">
                <label className="flex h-11 items-center gap-3 rounded-lg border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring/50">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-w-0 flex-1 bg-transparent text-sm outline-none" autoFocus />
                </label>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5">
                {sections.map((section) => (
                    <section key={section.id} className="mb-7">
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{section.name || copy.groups[section.id as keyof typeof copy.groups] || section.id}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {section.items.map((item) => {
                                const Icon = item.icon
                                return (
                                    <button key={item.id} onClick={() => { onSelect(item); closeAllTabs() }} className={cn('flex min-h-16 items-center gap-3 rounded-lg border border-border/70 bg-card px-3 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5')}>
                                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span>{getModuleLabel(item, language)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                ))}
                {!sections.length && <p className="py-12 text-center text-sm text-muted-foreground">{copy.empty}</p>}
            </div>
        </section>
    )
}
