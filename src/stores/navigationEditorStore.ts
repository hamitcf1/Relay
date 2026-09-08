import { create } from 'zustand'
import type { HotelNavigationConfig } from '@/types'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'

type EditorRole = 'base' | 'receptionist' | 'housekeeping'

interface NavigationEditorState {
    draft: HotelNavigationConfig | null
    selectedRole: EditorRole
    dirty: boolean
    load: (config?: HotelNavigationConfig) => void
    setRole: (role: EditorRole) => void
    renameSection: (sectionId: string, name: string) => void
    moveModule: (moduleId: string, targetSectionId: string, targetIndex: number) => void
    toggleRoleVisibility: (moduleId: string) => void
    togglePrimary: (moduleId: string) => void
    toggleMobile: (moduleId: string) => void
    toggleQuickAction: (actionId: string) => void
    markPublished: (version: number) => void
}

export const useNavigationEditorStore = create<NavigationEditorState>((set, get) => ({
    draft: null,
    selectedRole: 'base',
    dirty: false,
    load: (config) => set({ draft: normalizeNavigationConfig(config), dirty: false }),
    setRole: (selectedRole) => set({ selectedRole }),
    renameSection: (sectionId, name) => set((state) => state.draft ? {
        draft: { ...state.draft, sections: state.draft.sections.map((section) => section.id === sectionId ? { ...section, name } : section) },
        dirty: true,
    } : state),
    moveModule: (moduleId, targetSectionId, targetIndex) => set((state) => {
        if (!state.draft) return state
        if (state.selectedRole !== 'base') {
            const role = state.selectedRole
            const overlay = state.draft.roleOverlays?.[role] || {}
            const baseOrder = state.draft.sections.flatMap((section) => section.moduleIds)
            const currentOrder = overlay.moduleOrder
                ? [...overlay.moduleOrder, ...baseOrder.filter((id) => !overlay.moduleOrder!.includes(id))]
                : baseOrder
            const without = currentOrder.filter((id) => id !== moduleId)
            const baseSectionByModule = Object.fromEntries(state.draft.sections.flatMap((section) => section.moduleIds.map((id) => [id, section.id])))
            const sectionByModule = { ...overlay.sectionByModule, [moduleId]: targetSectionId }
            const targetMembers = without.filter((id) => (sectionByModule[id] || baseSectionByModule[id]) === targetSectionId)
            const anchor = targetMembers[targetIndex]
            const insertAt = anchor ? without.indexOf(anchor) : (targetMembers.length ? without.indexOf(targetMembers[targetMembers.length - 1]) + 1 : without.length)
            without.splice(insertAt, 0, moduleId)
            return {
                draft: { ...state.draft, roleOverlays: { ...state.draft.roleOverlays, [role]: { ...overlay, moduleOrder: without, sectionByModule } } },
                dirty: true,
            }
        }
        const sections = state.draft.sections.map((section) => ({ ...section, moduleIds: section.moduleIds.filter((id) => id !== moduleId) }))
        const target = sections.find((section) => section.id === targetSectionId)
        if (!target) return state
        target.moduleIds.splice(Math.max(0, Math.min(targetIndex, target.moduleIds.length)), 0, moduleId)
        return { draft: { ...state.draft, sections }, dirty: true }
    }),
    toggleRoleVisibility: (moduleId) => set((state) => {
        if (!state.draft || state.selectedRole === 'base') return state
        const role = state.selectedRole
        const overlay = state.draft.roleOverlays?.[role] || {}
        const hidden = new Set(overlay.hiddenModuleIds || [])
        if (hidden.has(moduleId)) hidden.delete(moduleId)
        else hidden.add(moduleId)
        return { draft: { ...state.draft, roleOverlays: { ...state.draft.roleOverlays, [role]: { ...overlay, hiddenModuleIds: [...hidden] } } }, dirty: true }
    }),
    togglePrimary: (moduleId) => set((state) => {
        if (!state.draft) return state
        const ids = state.draft.primaryModuleIds.includes(moduleId) ? state.draft.primaryModuleIds.filter((id) => id !== moduleId) : [...state.draft.primaryModuleIds, moduleId].slice(0, 6)
        return { draft: { ...state.draft, primaryModuleIds: ids }, dirty: true }
    }),
    toggleMobile: (moduleId) => set((state) => {
        if (!state.draft) return state
        const ids = state.draft.mobileModuleIds.includes(moduleId) ? state.draft.mobileModuleIds.filter((id) => id !== moduleId) : [...state.draft.mobileModuleIds, moduleId].slice(0, 3)
        return { draft: { ...state.draft, mobileModuleIds: ids }, dirty: true }
    }),
    toggleQuickAction: (actionId) => set((state) => {
        if (!state.draft) return state
        const ids = state.draft.quickActionIds.includes(actionId) ? state.draft.quickActionIds.filter((id) => id !== actionId) : [...state.draft.quickActionIds, actionId]
        return { draft: { ...state.draft, quickActionIds: ids }, dirty: true }
    }),
    markPublished: (version) => {
        const draft = get().draft
        if (draft) set({ draft: { ...draft, version }, dirty: false })
    },
}))
