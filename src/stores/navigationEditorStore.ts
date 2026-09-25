import { create } from 'zustand'
import type { HotelNavigationConfig, NavigationCustomLabel, NavigationLanguage } from '@/types'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'
import { normalizeCompactLayout } from '@/lib/workspace'

type EditorRole = 'base' | 'receptionist' | 'housekeeping'

interface NavigationEditorState {
    draft: HotelNavigationConfig | null
    loadedHotelId?: string
    selectedRole: EditorRole
    dirty: boolean
    load: (config?: HotelNavigationConfig, hotelId?: string) => void
    setRole: (role: EditorRole) => void
    renameSection: (sectionId: string, name: string) => void
    setModuleLabel: (moduleId: string, language: NavigationLanguage, value: string, surface?: 'full' | 'short') => void
    toggleRoleVisibility: (moduleId: string) => void
    toggleQuickAction: (actionId: string) => void
    moveCompactModule: (moduleId: string, column: 'left' | 'right', index: number) => void
    markPublished: (version: number) => void
}

function withLabel(existing: NavigationCustomLabel | undefined, language: NavigationLanguage, value: string, surface: 'full' | 'short') {
    const next: NavigationCustomLabel = {
        tr: existing?.tr || '',
        en: existing?.en || '',
        ru: existing?.ru || '',
        short: { ...existing?.short },
    }
    if (surface === 'short') next.short = { ...next.short, [language]: value }
    else next[language] = value
    const meaningful = [next.tr, next.en, next.ru, next.short?.tr, next.short?.en, next.short?.ru]
        .some((entry) => entry?.trim())
    return meaningful ? next : undefined
}

export const useNavigationEditorStore = create<NavigationEditorState>((set, get) => ({
    draft: null,
    loadedHotelId: undefined,
    selectedRole: 'base',
    dirty: false,
    load: (config, loadedHotelId) => set({ draft: normalizeNavigationConfig(config), loadedHotelId, dirty: false }),
    setRole: (selectedRole) => set({ selectedRole }),
    renameSection: (sectionId, name) => set((state) => state.draft ? {
        draft: { ...state.draft, sections: state.draft.sections.map((section) => section.id === sectionId ? { ...section, name } : section) },
        dirty: true,
    } : state),
    setModuleLabel: (moduleId, language, value, surface = 'full') => set((state) => {
        if (!state.draft) return state
        const customLabels = { ...state.draft.customLabels }
        const next = withLabel(state.draft.customLabels?.[moduleId], language, value, surface)
        if (next) customLabels[moduleId] = next
        else delete customLabels[moduleId]
        return { draft: { ...state.draft, customLabels }, dirty: true }
    }),
    toggleRoleVisibility: (moduleId) => set((state) => {
        if (!state.draft || state.selectedRole === 'base') return state
        const role = state.selectedRole
        const overlay = state.draft.roleOverlays?.[role] || {}
        const hidden = new Set(overlay.hiddenModuleIds || [])
        if (hidden.has(moduleId)) hidden.delete(moduleId)
        else hidden.add(moduleId)
        return { draft: { ...state.draft, roleOverlays: { ...state.draft.roleOverlays, [role]: { hiddenModuleIds: [...hidden] } } }, dirty: true }
    }),
    toggleQuickAction: (actionId) => set((state) => {
        if (!state.draft) return state
        const ids = state.draft.quickActionIds.includes(actionId) ? state.draft.quickActionIds.filter((id) => id !== actionId) : [...state.draft.quickActionIds, actionId]
        return { draft: { ...state.draft, quickActionIds: ids }, dirty: true }
    }),
    moveCompactModule: (moduleId, column, index) => set((state) => {
        if (!state.draft) return state
        const layout = normalizeCompactLayout(state.draft.compactLayout)
        const next = {
            left: layout.left.filter((id) => id !== moduleId),
            right: layout.right.filter((id) => id !== moduleId),
        }
        const target = next[column]
        target.splice(Math.max(0, Math.min(index, target.length)), 0, moduleId)
        return { draft: { ...state.draft, compactLayout: next }, dirty: true }
    }),
    markPublished: (version) => {
        const draft = get().draft
        if (draft) set({ draft: { ...draft, version }, dirty: false })
    },
}))
