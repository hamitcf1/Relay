import type { HotelNavigationConfig } from '@/types'
import {
    DEFAULT_MOBILE_IDS,
    DEFAULT_PRIMARY_IDS,
    MODULE_GROUPS,
    MODULE_REGISTRY,
    MOBILE_SLOT_COUNT,
} from '@/config/moduleRegistry'
import { DEFAULT_COMPACT_LAYOUT, normalizeCompactLayout } from '@/lib/workspace'

const KNOWN_IDS = new Set<string>(MODULE_REGISTRY.map((module) => module.id))

/** Section headings are admin-editable; the modules inside each section come from the registry. */
export const DEFAULT_SECTION_NAMES: Record<string, string> = {
    today: 'Bugün',
    operations: 'Operasyon',
    tools: 'Araçlar',
    management: 'Yönetim',
}

function buildSections(names?: Record<string, string>) {
    return MODULE_GROUPS.map((id) => ({
        id,
        name: names?.[id] || DEFAULT_SECTION_NAMES[id],
        moduleIds: MODULE_REGISTRY.filter((module) => module.group === id).map((module) => module.id),
    }))
}

export const DEFAULT_NAVIGATION_CONFIG: HotelNavigationConfig = {
    version: 1,
    sections: buildSections(),
    customLabels: {},
    primaryModuleIds: [...DEFAULT_PRIMARY_IDS],
    mobileModuleIds: [...DEFAULT_MOBILE_IDS],
    quickActionIds: ['notes', 'feedback', 'sales', 'messaging', 'calendar'],
    compactLayout: DEFAULT_COMPACT_LAYOUT,
    roleOverlays: {
        receptionist: { hiddenModuleIds: ['activity', 'settings'] },
        housekeeping: { hiddenModuleIds: ['activity', 'settings', 'pricing', 'sales'] },
    },
}

/** Keeps an explicit admin choice as-is (deduped, unknowns dropped) and only falls back when nothing survives. */
function knownIds(ids: unknown, fallback: string[], limit: number) {
    const clean = (source: string[]) => {
        const seen = new Set<string>()
        return source.filter((id) => {
            if (!KNOWN_IDS.has(id) || seen.has(id)) return false
            seen.add(id)
            return true
        }).slice(0, limit)
    }
    const explicit = Array.isArray(ids) ? clean(ids as string[]) : []
    return explicit.length ? explicit : clean(fallback)
}

export function normalizeNavigationConfig(config?: HotelNavigationConfig): HotelNavigationConfig {
    const names = Object.fromEntries((config?.sections || []).map((section) => [section.id, section.name]))
    const overlays = Object.fromEntries(Object.entries(config?.roleOverlays || {}).map(([role, overlay]) => [
        role,
        { hiddenModuleIds: knownIds(overlay?.hiddenModuleIds, [], 99) },
    ]))
    return {
        version: config?.version || DEFAULT_NAVIGATION_CONFIG.version,
        sections: buildSections(names),
        customLabels: { ...(config?.customLabels || {}) },
        primaryModuleIds: knownIds(config?.primaryModuleIds, DEFAULT_PRIMARY_IDS, 6),
        mobileModuleIds: knownIds(config?.mobileModuleIds, DEFAULT_MOBILE_IDS, MOBILE_SLOT_COUNT),
        quickActionIds: knownIds(config?.quickActionIds, DEFAULT_NAVIGATION_CONFIG.quickActionIds, 99),
        compactLayout: normalizeCompactLayout(config?.compactLayout),
        roleOverlays: overlays,
        updatedBy: config?.updatedBy,
        updatedByName: config?.updatedByName,
        updatedAt: config?.updatedAt,
    }
}

/** Section headings an admin has renamed, falling back to the built-in names. */
export function getSectionNames(config?: HotelNavigationConfig) {
    return Object.fromEntries(normalizeNavigationConfig(config).sections.map((section) => [section.id, section.name]))
}
