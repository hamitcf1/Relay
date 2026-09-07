import type { HotelNavigationConfig } from '@/types'

export const DEFAULT_NAVIGATION_CONFIG: HotelNavigationConfig = {
    version: 1,
    primaryModuleIds: ['overview', 'notes', 'roster', 'messaging'],
    mobileModuleIds: ['overview', 'notes', 'roster'],
    quickActionIds: ['notes', 'feedback', 'sales', 'messaging', 'calendar'],
    sections: [
        { id: 'today', name: 'Bugün', moduleIds: ['overview', 'notes', 'roster', 'messaging'] },
        { id: 'operations', name: 'Operasyon', moduleIds: ['compliance', 'feedback', 'sales', 'tours', 'cards-loans'] },
        { id: 'tools', name: 'Araçlar', moduleIds: ['hotel-info', 'currency', 'calendar', 'menu', 'blacklist'] },
        { id: 'management', name: 'Yönetim', moduleIds: ['pricing', 'off-days', 'team', 'activity', 'settings'] },
    ],
    roleOverlays: {
        receptionist: { hiddenModuleIds: ['activity', 'settings'] },
        housekeeping: { hiddenModuleIds: ['activity', 'settings', 'pricing', 'sales'] },
    },
}

export function normalizeNavigationConfig(config?: HotelNavigationConfig): HotelNavigationConfig {
    if (!config?.sections?.length) return structuredClone(DEFAULT_NAVIGATION_CONFIG)
    const knownIds = new Set(DEFAULT_NAVIGATION_CONFIG.sections.flatMap((section) => section.moduleIds))
    const sections = config.sections.map((section) => ({
        ...section,
        moduleIds: section.moduleIds.filter((id) => knownIds.has(id)),
    }))
    const placed = new Set(sections.flatMap((section) => section.moduleIds))
    const fallback = sections.find((section) => section.id === 'tools') || sections[0]
    for (const id of knownIds) if (!placed.has(id)) fallback.moduleIds.push(id)
    return {
        ...DEFAULT_NAVIGATION_CONFIG,
        ...config,
        sections,
        primaryModuleIds: config.primaryModuleIds.filter((id) => knownIds.has(id)).slice(0, 6),
        mobileModuleIds: config.mobileModuleIds.filter((id) => knownIds.has(id)).slice(0, 3),
    }
}
