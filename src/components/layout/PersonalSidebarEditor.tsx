import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getConfiguredSections, getModuleLabel, resolveNavigation, type SidebarPreferences } from '@/lib/navigation'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'

export function PersonalSidebarEditor({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const user = useAuthStore(state => state.user)
    const updateSettings = useAuthStore(state => state.updateSettings)
    const config = useHotelStore(state => state.hotel?.settings.navigation)
    const { language } = useLanguageStore()
    const nav = useMemo(() => resolveNavigation(user?.role, config), [user?.role, config])
    const sections = useMemo(() => getConfiguredSections(normalizeNavigationConfig(config), user?.role), [config, user?.role])
    const defaults = useMemo<SidebarPreferences>(() => ({
        favorite_ids: nav.primary.map(item => item.id),
        module_order: [...nav.primary, ...nav.sections.flatMap(section => section.items)].map(item => item.id),
        section_by_module: {},
    }), [nav])
    const [draft, setDraft] = useState<SidebarPreferences>(defaults)
    const [saving, setSaving] = useState(false)
    useEffect(() => { if (open) setDraft(user?.settings?.sidebar_preferences || defaults) }, [open, user?.settings?.sidebar_preferences, defaults])
    const allowed = new Map(nav.all.map(item => [item.id, item]))
    const ids = [...new Set([...draft.module_order, ...defaults.module_order])].filter(id => allowed.has(id as typeof nav.all[number]['id']))
    const selectedSection = (id: string) => draft.section_by_module[id] || sections.find(section => section.moduleIds.includes(id))?.id || 'tools'
    const move = (id: string, delta: number) => {
        const next = [...ids]
        const index = next.indexOf(id)
        const target = index + delta
        if (target < 0 || target >= next.length) return
        ;[next[index], next[target]] = [next[target], next[index]]
        setDraft(current => ({ ...current, module_order: next }))
    }
    const save = async () => {
        setSaving(true)
        try { await updateSettings({ sidebar_preferences: { ...draft, module_order: ids } }); toast.success('Kişisel yan panel kaydedildi.'); onOpenChange(false) }
        catch { toast.error('Yan panel kaydedilemedi.') }
        finally { setSaving(false) }
    }
    const labels = language === 'tr'
        ? { title: 'Yan panelimi düzenle', desc: 'Yıldızlı sekmeler üstte görünür. Sıra ve bölüm yalnızca sizin hesabınızda kaydedilir.', save: 'Kaydet', reset: 'Varsayılana dön', favorite: 'Yıldızla', section: 'Bölüm' }
        : language === 'ru'
            ? { title: 'Настроить боковую панель', desc: 'Избранное видно сверху. Порядок и разделы сохраняются только для вас.', save: 'Сохранить', reset: 'Сбросить', favorite: 'В избранное', section: 'Раздел' }
            : { title: 'Customize my sidebar', desc: 'Starred tabs appear at the top. Order and sections are saved only for your account.', save: 'Save', reset: 'Reset', favorite: 'Star', section: 'Section' }
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90dvh] max-w-xl flex-col overflow-hidden">
            <DialogHeader><DialogTitle>{labels.title}</DialogTitle><DialogDescription>{labels.desc}</DialogDescription></DialogHeader>
            <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
                {ids.map((id, index) => { const module = allowed.get(id as typeof nav.all[number]['id'])!; const Icon = module.icon; const starred = draft.favorite_ids.includes(id); return <div key={id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-28 flex-1 truncate text-sm font-medium">{getModuleLabel(module, language)}</span>
                    <button type="button" title={labels.favorite} aria-label={`${labels.favorite}: ${getModuleLabel(module, language)}`} aria-pressed={starred} onClick={() => setDraft(current => ({ ...current, favorite_ids: starred ? current.favorite_ids.filter(value => value !== id) : [...current.favorite_ids, id] }))} className={starred ? 'text-amber-500' : 'text-muted-foreground'}><Star className="h-4 w-4" fill={starred ? 'currentColor' : 'none'} /></button>
                    <select aria-label={`${getModuleLabel(module, language)} ${labels.section}`} value={selectedSection(id)} onChange={event => setDraft(current => ({ ...current, section_by_module: { ...current.section_by_module, [id]: event.target.value } }))} className="h-8 max-w-32 rounded-md border border-border bg-background px-1 text-xs" disabled={starred}>{sections.map(section => <option key={section.id} value={section.id}>{section.name || section.id}</option>)}</select>
                    <button type="button" aria-label={`${getModuleLabel(module, language)} yukarı`} disabled={index === 0} onClick={() => move(id, -1)} className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" aria-label={`${getModuleLabel(module, language)} aşağı`} disabled={index === ids.length - 1} onClick={() => move(id, 1)} className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                </div> })}
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-3"><Button variant="outline" onClick={() => setDraft(defaults)}>{labels.reset}</Button><Button onClick={save} disabled={saving}>{saving ? '...' : labels.save}</Button></div>
        </DialogContent>
    </Dialog>
}
