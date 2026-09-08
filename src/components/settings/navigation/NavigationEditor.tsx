import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Monitor, Save, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigationEditorStore } from '@/stores/navigationEditorStore'
import { findModule, getConfiguredSections, getModuleLabel } from '@/lib/navigation'
import type { ModuleId } from '@/config/moduleRegistry'
import { Button } from '@/components/ui/button'
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
        ? { title: 'Navigasyon ve hızlı işlemler', desc: 'Otel genelindeki masaüstü ve mobil menüleri düzenleyin.', base: 'Ortak düzen', reception: 'Resepsiyon', housekeeping: 'Kat hizmetleri', primary: 'Yan menüde göster', mobile: 'Mobil alt çubuk', publish: 'Herkes için yayınla', conflict: 'Düzen başka bir yönetici tarafından güncellendi. Güncel sürüm yüklendi.', quick: 'Hızlı işlem menüsü' }
        : { title: 'Navigation and quick actions', desc: 'Arrange hotel-wide desktop and mobile navigation.', base: 'Shared layout', reception: 'Reception', housekeeping: 'Housekeeping', primary: 'Show in sidebar', mobile: 'Mobile bottom bar', publish: 'Publish for everyone', conflict: 'Another administrator updated this layout. The current version was loaded.', quick: 'Quick action menu' }

    useEffect(() => {
        if (draftVersion === undefined || (!editor.dirty && draftVersion !== incomingVersion)) {
            editor.load(navigationConfig)
        }
    }, [draftVersion, editor.dirty, editor.load, incomingVersion, navigationConfig])

    if (!editor.draft || !hotel || !user) return null
    const role = editor.selectedRole === 'base' ? undefined : editor.selectedRole
    const hidden = new Set(role ? editor.draft.roleOverlays?.[role]?.hiddenModuleIds || [] : [])
    const displayedSections = getConfiguredSections(editor.draft, role)

    const publish = async () => {
        setPublishing(true)
        const result = await publishNavigation(hotel.id, editor.draft!, editor.draft!.version, { uid: user.uid, name: user.name })
        setPublishing(false)
        if (!result.ok) {
            editor.load(result.current)
            toast.error(copy.conflict)
            return
        }
        editor.markPublished(result.version)
        toast.success(language === 'tr' ? 'Navigasyon yayınlandı' : 'Navigation published')
    }

    return (
        <div className="space-y-6" data-testid="navigation-editor">
            <div><h2 className="text-xl font-semibold">{copy.title}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.desc}</p></div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Navigation role">
                {([['base', copy.base], ['receptionist', copy.reception], ['housekeeping', copy.housekeeping]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={editor.selectedRole === id} onClick={() => editor.setRole(id)} className={cn('rounded-lg border px-3 py-2 text-sm', editor.selectedRole === id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card')}>{label}</button>)}
            </div>

            <NavigationPreview config={editor.draft} role={role} />

            <div className="grid gap-4 xl:grid-cols-2">
                {displayedSections.map((section) => (
                    <section key={section.id} className="rounded-xl border border-border bg-card p-4" onDragOver={(event) => event.preventDefault()} onDrop={(event) => editor.moveModule(event.dataTransfer.getData('text/module-id'), section.id, section.moduleIds.length)}>
                        <input aria-label="Section name" value={section.name} disabled={editor.selectedRole !== 'base'} onChange={(event) => editor.renameSection(section.id, event.target.value)} className="mb-3 w-full border-b border-border bg-transparent pb-2 text-sm font-semibold outline-none focus:border-primary disabled:opacity-70" />
                        <div className="space-y-2">
                            {section.moduleIds.map((id, index) => {
                                const item = findModule(id as ModuleId)
                                if (!item) return null
                                const visible = !hidden.has(id)
                                return (
                                    <div key={id} draggable onDragStart={(event) => event.dataTransfer.setData('text/module-id', id)} onDrop={(event) => { event.stopPropagation(); editor.moveModule(event.dataTransfer.getData('text/module-id'), section.id, index) }} className="flex items-center gap-2 rounded-lg border border-border/70 bg-background p-2">
                                        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                                        <span className="min-w-0 flex-1 truncate text-sm">{getModuleLabel(item, language)}</span>
                                        <button aria-label="Move up" disabled={index === 0} onClick={() => editor.moveModule(id, section.id, index - 1)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-25"><ChevronUp className="h-3.5 w-3.5" /></button>
                                        <button aria-label="Move down" disabled={index === section.moduleIds.length - 1} onClick={() => editor.moveModule(id, section.id, index + 1)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-25"><ChevronDown className="h-3.5 w-3.5" /></button>
                                        {editor.selectedRole !== 'base' && <button onClick={() => editor.toggleRoleVisibility(id)} aria-label={visible ? 'Hide' : 'Show'} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted">{visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>}
                                        {editor.selectedRole === 'base' && <>
                                            <button title={copy.primary} aria-pressed={editor.draft!.primaryModuleIds.includes(id)} onClick={() => editor.togglePrimary(id)} className={cn('grid h-8 w-8 place-items-center rounded-md', editor.draft!.primaryModuleIds.includes(id) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}><Monitor className="h-4 w-4" /></button>
                                            <button title={copy.mobile} aria-pressed={editor.draft!.mobileModuleIds.includes(id)} onClick={() => editor.toggleMobile(id)} className={cn('grid h-8 w-8 place-items-center rounded-md', editor.draft!.mobileModuleIds.includes(id) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}><Smartphone className="h-4 w-4" /></button>
                                        </>}
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {editor.selectedRole === 'base' && <CompactLayoutEditor layout={editor.draft.compactLayout} language={language} onMove={editor.moveCompactModule} />}

            <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">{copy.quick}</h3>
                <div className="flex flex-wrap gap-2">{['notes', 'feedback', 'sales', 'messaging', 'calendar'].map((id) => <button key={id} aria-pressed={editor.draft!.quickActionIds.includes(id)} onClick={() => editor.toggleQuickAction(id)} className={cn('rounded-lg border px-3 py-2 text-sm', editor.draft!.quickActionIds.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{getModuleLabel(findModule(id as ModuleId)!, language)}</button>)}</div>
            </section>

            <div className="sticky bottom-3 flex items-center justify-between rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
                <p className="text-xs text-muted-foreground">{editor.dirty ? (language === 'tr' ? 'Yayınlanmamış değişiklikler var' : 'Unpublished changes') : (language === 'tr' ? 'Yayınlanan düzen güncel' : 'Published layout is current')}</p>
                <Button onClick={publish} disabled={!editor.dirty || publishing} className="gap-2"><Save className="h-4 w-4" />{copy.publish}</Button>
            </div>
        </div>
    )
}
