import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigationEditorStore } from '@/stores/navigationEditorStore'
import { getModuleLabel } from '@/lib/navigation'
import { MODULE_GROUPS, MODULE_REGISTRY } from '@/config/moduleRegistry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NavigationPreview } from './NavigationPreview'
import { cn } from '@/lib/utils'
import { DEFAULT_NAVIGATION_CONFIG } from '@/lib/navigationDefaults'
import { CompactLayoutEditor } from './CompactLayoutEditor'

export function NavigationEditor() {
    const hotel = useHotelStore((state) => state.hotel)
    const publishNavigation = useHotelStore((state) => state.publishNavigation)
    const user = useAuthStore((state) => state.user)
    const { language } = useLanguageStore()
    const editor = useNavigationEditorStore()
    const navigationConfig = hotel?.settings.navigation
    const draftVersion = editor.draft?.version
    const incomingVersion = navigationConfig?.version ?? DEFAULT_NAVIGATION_CONFIG.version
    const [publishing, setPublishing] = useState(false)
    const copy = language === 'tr'
        ? {
            title: 'Sekme adları ve erişim', desc: 'Herkes kendi sırasını ve yerleşimini kendi belirler. Yönetici olarak sadece adları, bölüm başlıklarını ve kimin hangi sekmeyi görebileceğini ayarlarsınız.',
            names: 'Sekme adları', namesHint: 'Sekmeyi yan panelde ve mobil alt çubukta bu adla gösterin. Kısa ad boşsa tam ad kullanılır.',
            registry: 'Varsayılan ad', custom: 'Görünen ad', short: 'Kısa ad', reset: 'Varsayılana dön',
            sections: 'Bölüm başlıkları', visibility: 'Rol bazlı görünürlük', visibilityHint: 'Gizlenen sekmeler o rol için hiçbir yerde görünmez.',
            quick: 'Hızlı işlem menüsü', publish: 'Herkes için yayınla', published: 'Yayınlandı',
            conflict: 'Düzen başka bir yönetici tarafından güncellendi. Güncel sürüm yüklendi.', error: 'Yayınlanamadı. Tekrar deneyin.',
            dirty: 'Yayınlanmamış değişiklikler var', clean: 'Yayınlanan düzen güncel', personal: 'Kişisel düzen',
        }
        : language === 'ru'
            ? {
                title: 'Названия вкладок и доступ', desc: 'Порядок и размещение каждый выбирает сам. Администратор задаёт только названия, заголовки разделов и права ролей.',
                names: 'Названия вкладок', namesHint: 'Показывать вкладку с этим названием в боковом меню и на нижней панели. Короткое название используется, если полное слишком длинное.',
                registry: 'Название по умолчанию', custom: 'Отображаемое', short: 'Короткое', reset: 'Сбросить',
                sections: 'Заголовки разделов', visibility: 'Видимость по ролям', visibilityHint: 'Скрытые вкладки недоступны этой роли.',
                quick: 'Меню быстрых действий', publish: 'Опубликовать для всех', published: 'Опубликовано',
                conflict: 'Другой администратор обновил макет. Загружена актуальная версия.', error: 'Не удалось опубликовать. Повторите попытку.',
                dirty: 'Есть неопубликованные изменения', clean: 'Опубликованный макет актуален', personal: 'Личный макет',
            }
            : {
                title: 'Tab names and access', desc: 'Everyone arranges their own sidebar. As an admin you set names, section headings and which roles can open which tab.',
                names: 'Tab names', namesHint: 'Show the tab under this name in the sidebar and mobile bar. The short name is used when the full one is too long.',
                registry: 'Default name', custom: 'Shown as', short: 'Short', reset: 'Reset',
                sections: 'Section headings', visibility: 'Role visibility', visibilityHint: 'Hidden tabs are unavailable to that role everywhere.',
                quick: 'Quick action menu', publish: 'Publish for everyone', published: 'Published',
                conflict: 'Another administrator updated this layout. The current version was loaded.', error: 'Could not publish. Try again.',
                dirty: 'Unpublished changes', clean: 'Published layout is current', personal: 'Personal layout',
            }

    useEffect(() => {
        if (editor.loadedHotelId !== hotel?.id || draftVersion === undefined || (!editor.dirty && draftVersion !== incomingVersion)) {
            editor.load(navigationConfig, hotel?.id)
        }
    }, [draftVersion, editor.dirty, editor.load, editor.loadedHotelId, hotel?.id, incomingVersion, navigationConfig])

    const hidden = useMemo(
        () => new Set(editor.selectedRole === 'base' ? [] : editor.draft?.roleOverlays?.[editor.selectedRole]?.hiddenModuleIds || []),
        [editor.draft, editor.selectedRole],
    )

    if (!editor.draft || !hotel || !user) return null
    const draft = editor.draft
    const role = editor.selectedRole === 'base' ? undefined : editor.selectedRole

    const publish = async () => {
        setPublishing(true)
        try {
            const result = await publishNavigation(hotel.id, draft, draft.version, { uid: user.uid, name: user.name })
            if (!result.ok) {
                editor.load(result.current, hotel.id)
                toast.error(copy.conflict)
                return
            }
            editor.markPublished(result.version)
            toast.success(copy.published)
        } catch {
            toast.error(copy.error)
        } finally {
            setPublishing(false)
        }
    }

    return (
        <div className="space-y-6" data-testid="navigation-editor">
            <div>
                <h2 className="text-xl font-semibold">{copy.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.desc}</p>
            </div>

            <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">{copy.names}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{copy.namesHint}</p>
                <div className="mt-3 grid gap-2">
                    {MODULE_GROUPS.map((group) => {
                        const section = draft.sections.find((item) => item.id === group)
                        const modules = MODULE_REGISTRY.filter((item) => item.group === group)
                        if (!modules.length) return null
                        return (
                            <div key={group} className="rounded-lg border border-border/70 p-2">
                                <p className="px-1 pb-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                    {section?.name || group}
                                </p>
                                <div className="space-y-1.5">
                                    {modules.map((item) => {
                                        const Icon = item.icon
                                        const custom = draft.customLabels?.[item.id]
                                        const fullValue = custom?.[language] || ''
                                        const shortValue = custom?.short?.[language] || ''
                                        const renamed = Boolean(fullValue.trim() || shortValue.trim())
                                        return (
                                            <div key={item.id} className="flex flex-wrap items-center gap-2">
                                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="w-40 shrink-0 truncate text-xs text-muted-foreground" title={item.labels[language]}>{item.labels[language]}</span>
                                                <Input
                                                    value={fullValue}
                                                    onChange={(event) => editor.setModuleLabel(item.id, language, event.target.value)}
                                                    placeholder={item.labels[language]}
                                                    aria-label={`${item.labels[language]} ${copy.custom}`}
                                                    className="h-8 min-w-32 flex-1 text-xs"
                                                />
                                                <Input
                                                    value={shortValue}
                                                    onChange={(event) => editor.setModuleLabel(item.id, language, event.target.value, 'short')}
                                                    placeholder={item.shortLabels?.[language] || item.labels[language]}
                                                    aria-label={`${item.labels[language]} ${copy.short}`}
                                                    className="h-8 w-28 shrink-0 text-xs"
                                                />
                                                {renamed && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            editor.setModuleLabel(item.id, language, '')
                                                            editor.setModuleLabel(item.id, language, '', 'short')
                                                        }}
                                                        className="shrink-0 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                                    >
                                                        {copy.reset}
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">{copy.sections}</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {draft.sections.map((section) => (
                        <label key={section.id} className="block">
                            <span className="mb-1 block text-[10px] font-medium text-muted-foreground">{section.id}</span>
                            <Input
                                aria-label="Section name"
                                value={section.name}
                                disabled={editor.selectedRole !== 'base'}
                                onChange={(event) => editor.renameSection(section.id, event.target.value)}
                                className="h-9 text-sm"
                            />
                        </label>
                    ))}
                </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">{copy.visibility}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{copy.visibilityHint}</p>
                <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Navigation role">
                    {([['base', language === 'tr' ? 'Ortak düzen' : language === 'ru' ? 'Общий макет' : 'Shared layout'],
                        ['receptionist', language === 'tr' ? 'Resepsiyon' : language === 'ru' ? 'Ресепшен' : 'Reception'],
                        ['housekeeping', language === 'tr' ? 'Kat hizmetleri' : language === 'ru' ? 'Хаускипинг' : 'Housekeeping']] as const).map(([id, label]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={editor.selectedRole === id}
                            onClick={() => editor.setRole(id)}
                            className={cn('rounded-lg border px-3 py-2 text-sm', editor.selectedRole === id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background')}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="mt-3 grid gap-1.5">
                    {MODULE_REGISTRY.map((item) => {
                        const Icon = item.icon
                        const visible = !hidden.has(item.id)
                        const configurable = editor.selectedRole !== 'base' && (!item.roles || item.roles.includes(editor.selectedRole))
                        return (
                            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/70 bg-background p-2">
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate text-sm">{getModuleLabel(item, language, draft)}</span>
                                {configurable && (
                                    <button
                                        onClick={() => editor.toggleRoleVisibility(item.id)}
                                        aria-label={visible ? `Hide ${item.labels[language]}` : `Show ${item.labels[language]}`}
                                        aria-pressed={!visible}
                                        className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-md', visible ? 'text-muted-foreground hover:bg-muted' : 'bg-primary/10 text-primary')}
                                    >
                                        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>

            <NavigationPreview config={draft} role={role} />

            <CompactLayoutEditor layout={draft.compactLayout} language={language} onMove={editor.moveCompactModule} />

            <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">{copy.quick}</h3>
                <div className="flex flex-wrap gap-2">
                    {MODULE_REGISTRY.map((item) => (
                        <button
                            key={item.id}
                            aria-pressed={draft.quickActionIds.includes(item.id)}
                            onClick={() => editor.toggleQuickAction(item.id)}
                            className={cn('rounded-lg border px-3 py-2 text-sm', draft.quickActionIds.includes(item.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}
                        >
                            {getModuleLabel(item, language, draft)}
                        </button>
                    ))}
                </div>
            </section>

            <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{editor.dirty ? copy.dirty : copy.clean}</p>
                    <p className="truncate text-[11px] text-muted-foreground/75">{copy.personal}: {copy.visibility}</p>
                </div>
                <Button onClick={publish} disabled={!editor.dirty || publishing} className="shrink-0 gap-2">
                    <Save className="h-4 w-4" />{copy.publish}
                </Button>
            </div>
        </div>
    )
}
