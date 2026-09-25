import type { HotelNavigationConfig } from '@/types'
import { getModuleLabel, resolveNavigation } from '@/lib/navigation'
import { MOBILE_SLOT_COUNT } from '@/config/moduleRegistry'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'

/** Shows the arrangement a brand new account inherits, so admins can see what they still control. */
export function NavigationPreview({ config, role }: { config: HotelNavigationConfig; role?: string }) {
    const { language } = useLanguageStore()
    const user = useAuthStore((state) => state.user)
    const resolved = resolveNavigation(user?.role ?? role, config)
    const half = Math.ceil(MOBILE_SLOT_COUNT / 2)
    const copy = language === 'tr'
        ? { defaultLabel: 'Yeni hesapların varsayılan düzeni', personal: 'Herkes kendi düzenini yapar; bu yalnızca henüz kayıt yapmamış hesaplar için geçerlidir.', desktop: 'Varsayılan masaüstü', all: 'Tüm araçlar', allShort: 'Tümü' }
        : language === 'ru'
            ? { defaultLabel: 'Макет по умолчанию для новых аккаунтов', personal: 'Каждый настраивает свой макет; это касается только аккаунтов без личных настроек.', desktop: 'Макет компьютера', all: 'Все инструменты', allShort: 'Все' }
            : { defaultLabel: 'Default layout for new accounts', personal: 'Everyone arranges their own; this only applies to accounts with no saved layout.', desktop: 'Default desktop', all: 'All tools', allShort: 'All' }
    const item = (id: string) => {
        const module = resolved.all.find((entry) => entry.id === id)
        return <span data-preview-item key={id} className="min-w-0 text-center text-[9px] leading-tight [overflow-wrap:anywhere] line-clamp-2">{module ? getModuleLabel(module, language, config) : id}</span>
    }
    return (
        <section className="rounded-xl border border-border bg-background p-3">
            <h3 className="text-sm font-semibold">{copy.defaultLabel}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{copy.personal}</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_260px]">
                <div className="rounded-xl bg-[hsl(var(--surface-deep))] p-3">
                    <p className="mb-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{copy.desktop}</p>
                    <div className="flex gap-3">
                        <div className="w-40 rounded-lg border border-border/60 p-2">
                            {resolved.primary.map((entry) => <div key={entry.id} className="mb-1 rounded-md bg-card px-2 py-1.5 text-[11px]">{getModuleLabel(entry, language, config)}</div>)}
                            <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground">{copy.all}</div>
                        </div>
                        <div className="flex-1 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">—</div>
                    </div>
                </div>
                <div className="rounded-xl p-3">
                    <div data-testid="navigation-mobile-preview" className="grid min-h-16 grid-cols-6 items-center gap-1 rounded-lg border border-border bg-card px-1 py-2">
                        {resolved.mobile.slice(0, half).map((entry) => item(entry.id))}
                        <span data-preview-item className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">+</span>
                        {resolved.mobile.slice(half).map((entry) => item(entry.id))}
                        <span data-preview-item className="min-w-0 text-center text-[9px] leading-tight">{copy.allShort}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
