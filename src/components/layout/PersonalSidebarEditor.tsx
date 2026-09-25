import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, EyeOff, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getModuleLabel, getModuleShortLabel, resolveNavigation, type SidebarPreferences } from '@/lib/navigation'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'
import { MOBILE_SLOT_COUNT, type ModuleId } from '@/config/moduleRegistry'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'

const SECTION_FALLBACK = 'tools'

export function PersonalSidebarEditor({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const user = useAuthStore(state => state.user)
    const updateSettings = useAuthStore(state => state.updateSettings)
    const config = useHotelStore(state => state.hotel?.settings.navigation)
    const { language } = useLanguageStore()
    const nav = useMemo(() => resolveNavigation(user?.role, config), [user?.role, config])
    const sections = useMemo(() => normalizeNavigationConfig(config).sections, [config])
    const defaults = useMemo<SidebarPreferences>(() => ({
        favorite_ids: nav.primary.map(item => item.id),
        module_order: nav.all.map(item => item.id),
        section_by_module: {},
        mobile_ids: nav.mobile.map(item => item.id),
        hidden_ids: [],
    }), [nav])
    const [draft, setDraft] = useState<SidebarPreferences>(defaults)
    const [saving, setSaving] = useState(false)
    useEffect(() => { if (open) setDraft(user?.settings?.sidebar_preferences || defaults) }, [open, user?.settings?.sidebar_preferences, defaults])

    const allowed = useMemo(() => new Map(nav.all.map(item => [item.id, item])), [nav])
    // Anything the account has never seen keeps its inherited default instead of disappearing.
    const ids = [...new Set([...draft.module_order, ...defaults.module_order])]
        .filter(id => allowed.has(id as ModuleId) && !(draft.hidden_ids || []).includes(id))
    const mobileIds = (draft.mobile_ids?.length ? draft.mobile_ids : defaults.mobile_ids || [])
        .filter(id => allowed.has(id as ModuleId) && ids.includes(id))
    const label = (id: string) => getModuleLabel(allowed.get(id as ModuleId)!, language, config)
    const shortLabel = (id: string) => getModuleShortLabel(allowed.get(id as ModuleId)!, language, config)
    const selectedSection = (id: string) => draft.section_by_module?.[id]
        || allowed.get(id as ModuleId)?.group
        || SECTION_FALLBACK

    const move = (id: string, delta: number) => setDraft(current => {
        const next = [...new Set([...(current.module_order || []), ...defaults.module_order])]
        const index = next.indexOf(id)
        const target = index + delta
        if (index < 0 || target < 0 || target >= next.length) return current
        ;[next[index], next[target]] = [next[target], next[index]]
        return { ...current, module_order: next }
    })
    const moveMobile = (id: string, delta: number) => setDraft(current => {
        const next = [...new Set([...(current.mobile_ids || []), ...defaults.mobile_ids || []])]
        const index = next.indexOf(id)
        const target = index + delta
        if (index < 0 || target < 0 || target >= next.length) return current
        ;[next[index], next[target]] = [next[target], next[index]]
        return { ...current, mobile_ids: next }
    })
    const toggleFavorite = (id: string) => setDraft(current => ({
        ...current,
        favorite_ids: (current.favorite_ids || []).includes(id)
            ? (current.favorite_ids || []).filter(value => value !== id)
            : [...(current.favorite_ids || []), id],
    }))
    const toggleHidden = (id: string) => setDraft(current => {
        const hidden = current.hidden_ids || []
        const next = hidden.includes(id) ? hidden.filter(value => value !== id) : [...hidden, id]
        return {
            ...current,
            hidden_ids: next,
            // A hidden tab cannot stay starred or pinned to the mobile bar.
            favorite_ids: (current.favorite_ids || []).filter(value => value !== id || !next.includes(id)),
            mobile_ids: (current.mobile_ids || []).filter(value => value !== id || !next.includes(id)),
        }
    })
    const toggleMobileSlot = (id: string) => setDraft(current => {
        const next = current.mobile_ids || []
        return { ...current, mobile_ids: next.includes(id) ? next.filter(value => value !== id) : [...next, id] }
    })

    const labels = language === 'tr'
        ? {
            title: 'Yan panelimi düzenle',
            desc: 'Bu ayarlar yalnızca sizin hesabınızda saklanır. Yöneticiler sıralamayı değil, yalnızca sekme adlarını ve erişimi yönetir.',
            save: 'Kaydet', reset: 'Varsayılana dön', success: 'Kişisel yan panel kaydedildi.', failure: 'Yan panel kaydedilemedi.',
            favorite: 'Yıldızla', section: 'Bölüm', up: 'yukarı', down: 'aşağı', hidden: 'Gizle', shown: 'Göster',
            mobile: 'Mobil alt çubuk', mobileHint: `En fazla ${MOBILE_SLOT_COUNT} sekme. Buradaki sıra sizin.`,
            mobileSlot: 'alt çubuğa ekle', mobileRemove: 'alt çubuktan çıkar', mobileFull: 'Çubuk dolu, önce bir sekmeyi çıkarın.',
        }
        : language === 'ru'
            ? {
                title: 'Настроить боковую панель',
                desc: 'Эти настройки хранятся только в вашем аккаунте. Администраторы управляют названиями и доступом, а не порядком.',
                save: 'Сохранить', reset: 'Сбросить', success: 'Личная панель сохранена.', failure: 'Не удалось сохранить панель.',
                favorite: 'В избранное', section: 'Раздел', up: 'вверх', down: 'вниз', hidden: 'Скрыть', shown: 'Показать',
                mobile: 'Нижняя панель', mobileHint: `Не более ${MOBILE_SLOT_COUNT} вкладок. Порядок ваш.`,
                mobileSlot: 'добавить в панель', mobileRemove: 'убрать из панели', mobileFull: 'Панель заполнена, сначала уберите вкладку.',
            }
            : {
                title: 'Customize my sidebar',
                desc: 'These settings are saved only to your account. Admins manage names and access, not your order.',
                save: 'Save', reset: 'Reset', success: 'Personal sidebar saved.', failure: 'Could not save the sidebar.',
                favorite: 'Star', section: 'Section', up: 'up', down: 'down', hidden: 'Hide', shown: 'Show',
                mobile: 'Mobile bottom bar', mobileHint: `Up to ${MOBILE_SLOT_COUNT} tabs. The order is yours.`,
                mobileSlot: 'add to bar', mobileRemove: 'remove from bar', mobileFull: 'Bar is full, remove a tab first.',
            }

    const save = async () => {
        setSaving(true)
        const trimmedMobile = (draft.mobile_ids || []).filter(id => ids.includes(id)).slice(0, MOBILE_SLOT_COUNT)
        try {
            await updateSettings({
                sidebar_preferences: {
                    favorite_ids: (draft.favorite_ids || []).filter(id => ids.includes(id)),
                    module_order: ids,
                    section_by_module: { ...(draft.section_by_module || {}) },
                    mobile_ids: trimmedMobile,
                    hidden_ids: (draft.hidden_ids || []).filter(id => allowed.has(id as ModuleId)),
                },
            })
            toast.success(labels.success)
            onOpenChange(false)
        } catch {
            toast.error(labels.failure)
        } finally {
            setSaving(false)
        }
    }

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col overflow-hidden">
            <DialogHeader>
                <DialogTitle>{labels.title}</DialogTitle>
                <DialogDescription>{labels.desc}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
                <div>
                    <h3 className="mb-1 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{labels.mobile}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">{labels.mobileHint}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {mobileIds.map((id, index) => (
                            <span key={id} className="flex items-center gap-0.5 rounded-lg border border-border bg-background py-1 pr-1 pl-2">
                                <span className="max-w-24 truncate text-xs font-medium">{shortLabel(id)}</span>
                                <button type="button" aria-label={`${label(id)} ${labels.mobileRemove}`} onClick={() => setDraft(current => ({ ...current, mobile_ids: (current.mobile_ids || []).filter(value => value !== id) }))} className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><EyeOff className="h-3 w-3" /></button>
                                <button type="button" aria-label={`${label(id)} ${labels.up}`} disabled={index === 0} onClick={() => moveMobile(id, -1)} className="disabled:opacity-25"><ArrowUp className="h-3 w-3" /></button>
                                <button type="button" aria-label={`${label(id)} ${labels.down}`} disabled={index === mobileIds.length - 1} onClick={() => moveMobile(id, 1)} className="disabled:opacity-25"><ArrowDown className="h-3 w-3" /></button>
                            </span>
                        ))}
                        <select
                            aria-label={labels.mobileSlot}
                            value=""
                            disabled={mobileIds.length >= MOBILE_SLOT_COUNT}
                            onChange={(event) => { if (event.target.value) toggleMobileSlot(event.target.value) }}
                            className="h-8 rounded-lg border border-dashed border-border bg-background px-2 text-xs text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <option value="">+</option>
                            {ids.filter(id => !mobileIds.includes(id)).map(id => <option key={id} value={id}>{label(id)}</option>)}
                        </select>
                        {mobileIds.length >= MOBILE_SLOT_COUNT && <span className="text-[11px] text-muted-foreground">{labels.mobileFull}</span>}
                    </div>
                </div>

                <div className="space-y-1.5">
                    {ids.map((id, index) => {
                        const module = allowed.get(id as ModuleId)!
                        const Icon = module.icon
                        const starred = (draft.favorite_ids || []).includes(id)
                        const isHidden = (draft.hidden_ids || []).includes(id)
                        return <div key={id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-28 flex-1 truncate text-sm font-medium">{label(id)}</span>
                            <button
                                type="button"
                                title={isHidden ? labels.shown : labels.hidden}
                                aria-label={`${isHidden ? labels.shown : labels.hidden}: ${label(id)}`}
                                aria-pressed={isHidden}
                                onClick={() => toggleHidden(id)}
                                className={isHidden ? 'text-muted-foreground' : 'text-muted-foreground/40 hover:text-foreground'}
                            >
                                <EyeOff className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title={labels.favorite}
                                aria-label={`${labels.favorite}: ${label(id)}`}
                                aria-pressed={starred}
                                onClick={() => toggleFavorite(id)}
                                className={starred ? 'text-amber-500' : 'text-muted-foreground'}
                            >
                                <Star className="h-4 w-4" fill={starred ? 'currentColor' : 'none'} />
                            </button>
                            <select
                                aria-label={`${label(id)} ${labels.section}`}
                                value={selectedSection(id)}
                                disabled={starred}
                                onChange={(event) => setDraft(current => ({ ...current, section_by_module: { ...(current.section_by_module || {}), [id]: event.target.value } }))}
                                className="h-8 max-w-32 rounded-md border border-border bg-background px-1 text-xs disabled:opacity-40"
                            >
                                {sections.map(section => <option key={section.id} value={section.id}>{section.name || section.id}</option>)}
                            </select>
                            <button type="button" aria-label={`${label(id)} ${labels.up}`} disabled={index === 0} onClick={() => move(id, -1)} className="disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                            <button type="button" aria-label={`${label(id)} ${labels.down}`} disabled={index === ids.length - 1} onClick={() => move(id, 1)} className="disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                        </div>
                    })}
                </div>
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-3">
                <Button variant="outline" onClick={() => setDraft(defaults)}>{labels.reset}</Button>
                <Button onClick={save} disabled={saving}>{saving ? '...' : labels.save}</Button>
            </div>
        </DialogContent>
    </Dialog>
}
