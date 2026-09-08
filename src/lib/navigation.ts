import { DEFAULT_PRIMARY_IDS, MODULE_REGISTRY, type ModuleDefinition, type ModuleGroup, type ModuleId } from '@/config/moduleRegistry'
import type { HotelNavigationConfig } from '@/types'
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
        ? configuredOrder.filter((id) => config.primaryModuleIds.includes(id))
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
