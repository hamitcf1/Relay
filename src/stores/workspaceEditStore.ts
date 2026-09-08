import { create } from 'zustand'

interface WorkspaceEditState {
    dirtyIds: string[]
    setDirty: (id: string, dirty: boolean) => void
    clear: () => void
}

export const useWorkspaceEditStore = create<WorkspaceEditState>((set) => ({
    dirtyIds: [],
    setDirty: (id, dirty) => set((state) => ({
        dirtyIds: dirty
            ? state.dirtyIds.includes(id) ? state.dirtyIds : [...state.dirtyIds, id]
            : state.dirtyIds.filter((current) => current !== id),
    })),
    clear: () => set({ dirtyIds: [] }),
}))
