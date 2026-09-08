import { create } from 'zustand'

interface NavigationState {
    allTabsOpen: boolean
    quickActionsOpen: boolean
    openAllTabs: () => void
    closeAllTabs: () => void
    openQuickActions: () => void
    closeQuickActions: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
    allTabsOpen: false,
    quickActionsOpen: false,
    openAllTabs: () => set({ allTabsOpen: true, quickActionsOpen: false }),
    closeAllTabs: () => set({ allTabsOpen: false }),
    openQuickActions: () => set({ quickActionsOpen: true, allTabsOpen: false }),
    closeQuickActions: () => set({ quickActionsOpen: false }),
}))
