import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { getModuleLabel, resolveNavigation, findModule } from '@/lib/navigation'
import { normalizeCompactLayout } from '@/lib/workspace'
import type { ModuleId } from '@/config/moduleRegistry'
import { CompactModuleCard } from './CompactModuleCard'
import { ModuleContent } from './ModuleContent'

interface CompactShiftProps {
    focusModule?: string | null
    initialAddOpen?: boolean
    onFocusHandled?: () => void
    onModuleFocus?: (id: string) => void
}

export function CompactShift({ focusModule, initialAddOpen, onFocusHandled, onModuleFocus }: CompactShiftProps) {
    const user = useAuthStore((state) => state.user)
    const updateSettings = useAuthStore((state) => state.updateSettings)
    const hotel = useHotelStore((state) => state.hotel)
    const { language } = useLanguageStore()
    const isMobile = useIsMobile()
    const layout = useMemo(() => normalizeCompactLayout(hotel?.settings.navigation?.compactLayout), [hotel?.settings.navigation?.compactLayout])
    const allowed = useMemo(() => new Set(resolveNavigation(user?.role, hotel?.settings.navigation).all.map((item) => item.id)), [hotel?.settings.navigation, user?.role])
    const settingKey = isMobile ? 'compact_collapsed_mobile' as const : 'compact_collapsed_desktop' as const
    const collapsed = user?.settings?.[settingKey] || {}
    const columns = isMobile ? [{ id: 'mobile', ids: [...layout.left, ...layout.right] }] : [{ id: 'left', ids: layout.left }, { id: 'right', ids: layout.right }]
    const settingsQueue = useRef(Promise.resolve())
    const preferenceError = language === 'tr' ? 'Kart görünümü kaydedilemedi' : language === 'ru' ? 'Не удалось сохранить вид карточки' : 'Could not save card preference'

    const isCollapsed = (id: string) => collapsed[id] ?? (isMobile ? id !== 'notes' : false)
    const saveExpanded = useCallback((id: string, expanded: boolean) => {
        settingsQueue.current = settingsQueue.current
            .then(async () => {
                const latest = useAuthStore.getState().user?.settings?.[settingKey] || {}
                await updateSettings({ [settingKey]: { ...latest, [id]: !expanded } })
            })
            .catch(() => { toast.error(preferenceError) })
        return settingsQueue.current
    }, [preferenceError, settingKey, updateSettings])

    useEffect(() => {
        if (!focusModule || !allowed.has(focusModule as ModuleId)) return
        let cancelled = false
        const focus = async () => {
            if (isCollapsed(focusModule)) {
                await saveExpanded(focusModule, true)
            }
            if (cancelled) return
            window.requestAnimationFrame(() => {
                document.querySelector(`[data-testid="compact-card-${focusModule}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                onFocusHandled?.()
            })
        }
        void focus()
        return () => { cancelled = true }
    }, [allowed, collapsed, focusModule, onFocusHandled, saveExpanded])

    return (
        <div data-testid="compact-workspace" className="h-full min-h-0">
            <div className={isMobile ? 'h-full overflow-y-auto px-4 pb-28 pt-4' : 'grid h-full min-h-0 grid-cols-2 gap-5 p-5'}>
                {columns.map((column) => (
                    <div key={column.id} data-testid={`compact-shift-${column.id}`} className={isMobile ? 'space-y-4' : 'min-h-0 space-y-5 overflow-y-auto pr-1 custom-scrollbar'}>
                        {column.ids.filter((id) => allowed.has(id as ModuleId)).map((id) => {
                            const module = findModule(id as ModuleId)
                            if (!module) return null
                            const expanded = !isCollapsed(id)
                            return (
                                <CompactModuleCard key={id} id={id} label={getModuleLabel(module, language)} expanded={expanded} onExpandedChange={(next) => { void saveExpanded(id, next) }} onInteract={() => onModuleFocus?.(id)}>
                                    <ModuleContent moduleId={module.id} hotelId={hotel?.id || ''} canEdit={user?.role === 'gm'} initialAddOpen={module.id === 'notes' ? initialAddOpen : undefined} />
                                </CompactModuleCard>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
