import {
    MODULE_GROUPS,
    MODULE_REGISTRY,
    MOBILE_SLOT_COUNT,
    type ModuleDefinition,
    type ModuleGroup,
    type ModuleId,
} from '@/config/moduleRegistry'
import type { HotelNavigationConfig, NavigationLanguage, UserSettings } from '@/types'
import { getSectionNames, normalizeNavigationConfig } from '@/lib/navigationDefaults'

export interface ResolvedNavigation {
    primary: ModuleDefinition[]
    sections: Array<{ id: ModuleGroup | string; name?: string; items: ModuleDefinition[] }>
    all: ModuleDefinition[]
    mobile: ModuleDefinition[]
    quickActionIds: string[]
}

export function findModule(id: ModuleId) {
    return MODULE_REGISTRY.find((item) => item.id === id)
}

/** Admin display name for a tab, falling back to the registry for unset languages. */
export function getModuleLabel(item: ModuleDefinition, language: NavigationLanguage, config?: HotelNavigationConfig) {
    return config?.customLabels?.[item.id]?.[language]?.trim() || item.labels[language]
}

/**
 * Narrow-surface label for the mobile bottom bar. A custom name that already fits
 * replaces the built-in short label; longer ones fall back so the bar never truncates.
 */
export function getModuleShortLabel(item: ModuleDefinition, language: NavigationLanguage, config?: HotelNavigationConfig) {
    const custom = config?.customLabels?.[item.id]?.short?.[language]?.trim()
    if (custom) return custom
    const full = getModuleLabel(item, language, config)
    return full.length <= 12 ? full : item.shortLabels?.[language] || item.labels[language]
}

/** Modules a role may open: registry permissions minus the admin's hidden list. */
function visibleModules(role?: string, config?: HotelNavigationConfig) {
    const hidden = new Set(role ? config?.roleOverlays?.[role]?.hiddenModuleIds || [] : [])
    return MODULE_REGISTRY.filter((item) => (!item.roles || (role ? item.roles.includes(role) : false)) && !hidden.has(item.id))
}

/** The shared default arrangement, used by surfaces that have no account of their own. */
export function resolveNavigation(role?: string, publishedConfig?: HotelNavigationConfig): ResolvedNavigation {
    const config = normalizeNavigationConfig(publishedConfig)
    const byId = new Map(visibleModules(role, config).map((item) => [item.id, item]))
    // Starred tabs lead in their inherited order; everything else keeps the registry order.
    const order = [...new Set([...config.primaryModuleIds, ...MODULE_REGISTRY.map((item) => item.id)])]
        .filter((id) => byId.has(id as ModuleId))
        .map((id) => byId.get(id as ModuleId)!)
    const favorites = new Set(config.primaryModuleIds)
    const sectionOf = new Map(MODULE_REGISTRY.map((item) => [item.id, item.group]))
    const names = getSectionNames(publishedConfig)
    const sections = MODULE_GROUPS
        .map((id) => ({
            id,
            name: names[id],
            items: order.filter((item) => !favorites.has(item.id) && sectionOf.get(item.id) === id),
        }))
        .filter((section) => section.items.length)
    return {
        primary: order.filter((item) => favorites.has(item.id)),
        sections,
        all: [...byId.values()],
        mobile: config.mobileModuleIds.map((id) => byId.get(id as ModuleId)).filter((item): item is ModuleDefinition => Boolean(item)),
        quickActionIds: config.quickActionIds,
    }
}

export type SidebarPreferences = NonNullable<UserSettings['sidebar_preferences']>

/**
 * The account's own arrangement. Order, starred tabs, section membership, the mobile bar and
 * per-account hiding are all decided here; the shared config only supplies the defaults an
 * account inherits before it saves anything, plus the access control it can never override.
 */
export function resolvePersonalNavigation(role?: string, publishedConfig?: HotelNavigationConfig, preferences?: SidebarPreferences): ResolvedNavigation {
    const base = resolveNavigation(role, publishedConfig)
    if (!preferences) return base

    const byId = new Map(base.all.map((item) => [item.id, item]))
    const hidden = new Set((preferences.hidden_ids || []).filter((id) => byId.has(id as ModuleId)))
    const favorites = new Set((preferences.favorite_ids || []).filter((id) => byId.has(id as ModuleId) && !hidden.has(id)))
    // Personal order first, then anything the account has never seen keeps the shared default.
    const order = [...new Set([...(preferences.module_order || []), ...base.all.map((item) => item.id)])]
        .filter((id) => byId.has(id as ModuleId) && !hidden.has(id))
        .map((id) => byId.get(id as ModuleId)!)
    const sectionOf = new Map(MODULE_REGISTRY.map((item) => [item.id, item.group]))
    const names = getSectionNames(publishedConfig)
    const sections = MODULE_GROUPS
        .map((id) => ({
            id,
            name: names[id],
            items: order.filter((item) => !favorites.has(item.id)
                && (preferences.section_by_module?.[item.id] || sectionOf.get(item.id)) === id),
        }))
        .filter((section) => section.items.length)
    const mobileIds = [...new Set(preferences.mobile_ids?.length ? preferences.mobile_ids : base.mobile.map((item) => item.id))]
        .filter((id) => byId.has(id as ModuleId) && !hidden.has(id))
        .slice(0, MOBILE_SLOT_COUNT)
        .map((id) => byId.get(id as ModuleId)!)

    return {
        ...base,
        all: order,
        primary: order.filter((item) => favorites.has(item.id)),
        sections,
        mobile: mobileIds,
    }
}
