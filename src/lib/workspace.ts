import { MODULE_REGISTRY, type ModuleId } from '@/config/moduleRegistry'
import type { CompactLayout, UserSettings, WorkspaceMode } from '@/types'

export const DEFAULT_COMPACT_LAYOUT: CompactLayout = {
    left: ['notes', 'roster', 'blacklist'],
    right: ['hotel-info', 'currency', 'menu', 'calendar'],
}

const COMPACT_SHIFT_IDS = new Set([...DEFAULT_COMPACT_LAYOUT.left, ...DEFAULT_COMPACT_LAYOUT.right])
const KNOWN_MODULE_IDS = new Set(MODULE_REGISTRY.map((module) => module.id))

export function normalizeCompactLayout(input?: CompactLayout): CompactLayout {
    if (!input) return structuredClone(DEFAULT_COMPACT_LAYOUT)

    const seen = new Set<string>()
    const clean = (ids: string[]) => ids.filter((id) => {
        if (!COMPACT_SHIFT_IDS.has(id) || seen.has(id)) return false
        seen.add(id)
        return true
    })
    const left = clean(input.left || [])
    const right = clean(input.right || [])

    for (const id of DEFAULT_COMPACT_LAYOUT.left) if (!seen.has(id)) left.push(id)
    for (const id of DEFAULT_COMPACT_LAYOUT.right) if (!seen.has(id)) right.push(id)
    return { left, right }
}

export function resolveWorkspaceTarget(moduleId: string, mode: 'compact'): { area: 'shift' | 'operations'; moduleId: ModuleId }
export function resolveWorkspaceTarget(moduleId: string, mode: 'modern'): { area: 'overview' | 'operations'; moduleId: ModuleId }
export function resolveWorkspaceTarget(moduleId: string, mode: WorkspaceMode) {
    const validId = KNOWN_MODULE_IDS.has(moduleId as ModuleId) ? moduleId as ModuleId : 'overview'
    if (mode === 'compact') {
        return {
            area: COMPACT_SHIFT_IDS.has(validId) ? 'shift' as const : 'operations' as const,
            moduleId: validId,
        }
    }
    const module = MODULE_REGISTRY.find((item) => item.id === validId)
    return { area: module?.area || 'overview', moduleId: validId }
}

export function buildUserSettingsPatch(settings: Partial<UserSettings>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(settings)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [`settings.${key}`, value]),
    )
}
