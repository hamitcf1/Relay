import { DEFAULT_PRIMARY_IDS, MODULE_REGISTRY, type ModuleDefinition, type ModuleGroup, type ModuleId } from '@/config/moduleRegistry'
import type { HotelNavigationConfig, UserSettings } from '@/types'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'

export interface ResolvedNavigation {
    primary: ModuleDefinition[]
    sections: Array<{ id: ModuleGroup | string; name?: string; items: ModuleDefinition[] }>
    all: ModuleDefinition[]
    mobile: ModuleDefinition[]
    quickActionIds: string[]
}

export function getConfiguredSections(config: HotelNavigationConfig, role?: string) {
    const overlay = role ? config.roleOverlays?.[role] : undefined
    const baseOrder = config.sections.flatMap((section) => section.moduleIds)
    const orderedIds = overlay?.moduleOrder
        ? [...overlay.moduleOrder, ...baseOrder.filter((id) => !overlay.moduleOrder!.includes(id))]
        : baseOrder
    const baseSectionByModule = Object.fromEntries(config.sections.flatMap((section) => section.moduleIds.map((id) => [id, section.id])))
    return config.sections.map((section) => ({
        ...section,
        moduleIds: orderedIds.filter((id) => (overlay?.sectionByModule?.[id] || baseSectionByModule[id]) === section.id),
    }))
}

export function resolveNavigation(role?: string, publishedConfig?: HotelNavigationConfig): ResolvedNavigation {
    const config = normalizeNavigationConfig(publishedConfig)
    const overlay = role ? config.roleOverlays?.[role] : undefined
    const hidden = new Set(overlay?.hiddenModuleIds || [])
    const all = MODULE_REGISTRY.filter((item) => (!item.roles || (role ? item.roles.includes(role) : false)) && !hidden.has(item.id))
    const effectiveSections = getConfiguredSections(config, role)
    const configuredOrder = effectiveSections.flatMap((section) => section.moduleIds)
    const primaryIds = publishedConfig
        ? ['personal-notes', ...configuredOrder.filter((id) => config.primaryModuleIds.includes(id) && id !== 'personal-notes')]
        : DEFAULT_PRIMARY_IDS
    const primary = primaryIds
        .map((id) => all.find((item) => item.id === id))
        .filter((item): item is ModuleDefinition => Boolean(item))
    const sections = effectiveSections
        .map((section) => {
            const items = section.moduleIds
                .map((id) => all.find((item) => item.id === id))
                .filter((item): item is ModuleDefinition => Boolean(item))
                .filter((item) => !primary.some((primaryItem) => primaryItem.id === item.id))
            return { id: section.id, name: section.name, items }
        })
        .filter((section) => section.items.length > 0)
    const mobileIds = configuredOrder.filter((id) => config.mobileModuleIds.includes(id))
    const mobile = mobileIds.map((id) => all.find((item) => item.id === id)).filter((item): item is ModuleDefinition => Boolean(item))
    return { primary, sections, all, mobile, quickActionIds: config.quickActionIds }
}

export function findModule(id: ModuleId) {
    return MODULE_REGISTRY.find((item) => item.id === id)
}

export function getModuleLabel(item: ModuleDefinition, language: 'tr' | 'en' | 'ru') {
    return item.labels[language]
}

export type SidebarPreferences = NonNullable<UserSettings['sidebar_preferences']>

/** Personal ordering can rearrange visible modules, but never grants access to hidden modules. */
export function resolvePersonalNavigation(role?: string, publishedConfig?: HotelNavigationConfig, preferences?: SidebarPreferences): ResolvedNavigation {
    const base = resolveNavigation(role, publishedConfig)
    if (!preferences) return base
    const allowed = new Map(base.all.map(item => [item.id, item]))
    const baseline = [...base.primary, ...base.sections.flatMap(section => section.items)]
    const orderedIds = [...new Set([...preferences.module_order, ...baseline.map(item => item.id)])].filter(id => allowed.has(id as ModuleId))
    const favorites = new Set(preferences.favorite_ids.filter(id => allowed.has(id as ModuleId)))
    const primary = orderedIds.filter(id => favorites.has(id)).map(id => allowed.get(id as ModuleId)!)
    const sections = getConfiguredSections(normalizeNavigationConfig(publishedConfig), role).map(section => ({
        id: section.id,
        name: section.name,
        items: orderedIds.filter(id => !favorites.has(id) && (preferences.section_by_module[id] || sectionForModule(id, publishedConfig, role)) === section.id)
            .map(id => allowed.get(id as ModuleId)!),
    })).filter(section => section.items.length)
    return { ...base, primary, sections }
}

function sectionForModule(id: string, config?: HotelNavigationConfig, role?: string) {
    return getConfiguredSections(normalizeNavigationConfig(config), role).find(section => section.moduleIds.includes(id))?.id || 'tools'
}
