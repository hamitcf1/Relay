import { DEFAULT_PRIMARY_IDS, MODULE_REGISTRY, type ModuleDefinition, type ModuleGroup, type ModuleId } from '@/config/moduleRegistry'

export interface ResolvedNavigation {
    primary: ModuleDefinition[]
    sections: Array<{ id: ModuleGroup; items: ModuleDefinition[] }>
    all: ModuleDefinition[]
}

export function resolveNavigation(role?: string): ResolvedNavigation {
    const all = MODULE_REGISTRY.filter((item) => !item.roles || (role ? item.roles.includes(role) : false))
    const primary = DEFAULT_PRIMARY_IDS
        .map((id) => all.find((item) => item.id === id))
        .filter((item): item is ModuleDefinition => Boolean(item))
    const sectionOrder: ModuleGroup[] = ['today', 'operations', 'tools', 'management']
    const sections = sectionOrder
        .map((id) => ({ id, items: all.filter((item) => item.group === id && !primary.some((primaryItem) => primaryItem.id === item.id)) }))
        .filter((section) => section.items.length > 0)
    return { primary, sections, all }
}

export function findModule(id: ModuleId) {
    return MODULE_REGISTRY.find((item) => item.id === id)
}

export function getModuleLabel(item: ModuleDefinition, language: 'tr' | 'en' | 'ru') {
    return item.labels[language]
}
