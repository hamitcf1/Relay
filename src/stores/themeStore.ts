import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

export type Theme = 'light' | 'dark'

export interface AccentColor {
    name: string
    value: string // HSL values like "239 84% 67%"
}

export const ACCENT_COLORS: AccentColor[] = [
    { name: 'Indigo', value: '239 84% 67%' },
    { name: 'Sky', value: '199 89% 48%' },
    { name: 'Emerald', value: '158 64% 52%' },
    { name: 'Rose', value: '346 87% 57%' },
    { name: 'Amber', value: '38 92% 50%' },
    { name: 'Violet', value: '262 83% 58%' },
]

interface ThemeState {
    theme: Theme
    accentColor: string
}

interface ThemeActions {
    setTheme: (theme: Theme) => void
    setAccentColor: (color: string) => void
    toggleTheme: () => void
    applyTheme: () => void
    syncFromUser: () => void
}

type ThemeStore = ThemeState & ThemeActions

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            accentColor: '239 84% 67%', // Default Indigo

            setTheme: (theme) => {
                set({ theme })
                get().applyTheme()
                // Persist to Firebase if user is logged in
                const { user } = useAuthStore.getState()
                if (user) {
                    useAuthStore.getState().updateSettings({ theme })
                }
            },

            setAccentColor: (accentColor) => {
                set({ accentColor })
                get().applyTheme()
                // Persist to Firebase if user is logged in
                const { user } = useAuthStore.getState()
                if (user) {
                    useAuthStore.getState().updateSettings({ accent_color: accentColor })
                }
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark'
                get().setTheme(newTheme)
            },

            applyTheme: () => {
                const { theme, accentColor } = get()
                const root = window.document.documentElement

                // Toggle classes
                root.classList.remove('light', 'dark')
                root.classList.add(theme)

                // Apply CSS Variables
                root.style.setProperty('--primary', accentColor)
                root.style.setProperty('--ring', accentColor)

                // Update meta theme-color
                const metaThemeColor = window.document.querySelector('meta[name="theme-color"]')
                if (metaThemeColor) {
                    metaThemeColor.setAttribute('content', theme === 'dark' ? '#09090b' : '#ffffff')
                }
            },

            // Called after login to load user's saved preferences from Firebase
            syncFromUser: () => {
                const { user } = useAuthStore.getState()
                if (!user?.settings) return

                const { theme, accent_color } = user.settings
                const updates: Partial<ThemeState> = {}

                if (theme) updates.theme = theme
                if (accent_color) updates.accentColor = accent_color

                if (Object.keys(updates).length > 0) {
                    set(updates)
                    get().applyTheme()
                }
            },
        }),
        {
            name: 'relay-theme-storage', // Keep localStorage as fallback for unauthenticated pages
        }
    )
)

// Sync theme with Firestore when user logs in
useAuthStore.subscribe((state) => {
    const settings = state.user?.settings
    if (settings) {
        const store = useThemeStore.getState()
        if (settings.theme && settings.theme !== store.theme) {
            useThemeStore.setState({ theme: settings.theme })
            store.applyTheme()
        }
        if (settings.accent_color && settings.accent_color !== store.accentColor) {
            useThemeStore.setState({ accentColor: settings.accent_color })
            store.applyTheme()
        }
    }
})
