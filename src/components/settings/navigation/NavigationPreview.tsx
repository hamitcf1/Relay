import type { HotelNavigationConfig } from '@/types'
import { findModule, getModuleLabel, resolveNavigation } from '@/lib/navigation'
import type { ModuleId } from '@/config/moduleRegistry'
import { useLanguageStore } from '@/stores/languageStore'

export function NavigationPreview({ config, role }: { config: HotelNavigationConfig; role?: string }) {
    const { language } = useLanguageStore()
    const resolved = resolveNavigation(role, config)
    return (
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="rounded-xl border border-border bg-background p-3">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Desktop</p>
                <div className="flex gap-3">
                    <div className="w-40 rounded-lg bg-[hsl(var(--surface-deep))] p-2">
                        {resolved.primary.map((item) => <div key={item.id} className="mb-1 rounded-md bg-card px-2 py-1.5 text-[11px]">{getModuleLabel(item, language)}</div>)}
                        <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground">Tüm araçlar</div>
                    </div>
                    <div className="flex-1 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">İçerik alanı</div>
                </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Mobile</p>
                <div className="flex h-16 items-center justify-around rounded-lg border border-border bg-card px-1">
                    {config.mobileModuleIds.slice(0, 2).map((id) => { const item = findModule(id as ModuleId); return <span key={id} className="text-[9px]">{item ? getModuleLabel(item, language) : id}</span> })}
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">+</span>
                    {config.mobileModuleIds.slice(2, 3).map((id) => { const item = findModule(id as ModuleId); return <span key={id} className="text-[9px]">{item ? getModuleLabel(item, language) : id}</span> })}
                    <span className="text-[9px]">Tümü</span>
                </div>
            </div>
        </div>
    )
}
