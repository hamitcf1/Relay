import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

export type Theme = 'light' | 'dark'

const ALL_THEMES: Theme[] = ['light', 'dark']
const LEGACY_DARK_THEMES = ['comfort', 'midnight']

export interface AccentColor {
    key: string
    value: string // HSL values like "239 84% 67%"
}

export const ACCENT_COLORS: AccentColor[] = [
    { key: 'slateBlue', value: '207 42% 45%' },
    { key: 'amber', value: '38 72% 46%' },
    { key: 'teal', value: '166 42% 38%' },
    { key: 'violet', value: '263 36% 50%' },
    { key: 'rose', value: '350 48% 48%' },
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

const META_THEME_COLOR: Record<Theme, string> = {
    light: '#f7f8fa',
    dark: '#09090b',
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            accentColor: ACCENT_COLORS[0].value,

            setTheme: (theme) => {
                set({ theme })
                get().applyTheme()
                const { user } = useAuthStore.getState()
                if (user) {
                    useAuthStore.getState().updateSettings({ theme })
                }
            },

            setAccentColor: (accentColor) => {
                set({ accentColor })
                get().applyTheme()
                const { user } = useAuthStore.getState()
                if (user) {
                    useAuthStore.getState().updateSettings({ accent_color: accentColor })
                }
            },

            toggleTheme: () => {
                const { theme } = get()
                const next = theme === 'dark' ? 'light' : 'dark'
                set({ theme: next })
                get().applyTheme()
            },

            applyTheme: () => {
                const { theme, accentColor } = get()
                const root = window.document.documentElement

                root.classList.remove(...ALL_THEMES)
                root.classList.add(theme)

                root.style.setProperty('--primary', accentColor)
                root.style.setProperty('--primary-foreground', theme === 'dark' ? '216 24% 7%' : '0 0% 100%')
                root.style.setProperty('--ring', accentColor)

                const metaThemeColor = window.document.querySelector('meta[name="theme-color"]')
                if (metaThemeColor) {
                    metaThemeColor.setAttribute('content', META_THEME_COLOR[theme])
                }
            },

            syncFromUser: () => {
                const { user } = useAuthStore.getState()
                if (!user?.settings) return

                const { theme, accent_color } = user.settings
                const updates: Partial<ThemeState> = {}

                if (theme) {
                    updates.theme = LEGACY_DARK_THEMES.includes(theme) || theme === 'dark' ? 'dark' : 'light'
                }
                if (accent_color) {
                    updates.accentColor = ACCENT_COLORS.some((color) => color.value === accent_color)
                        ? accent_color
                        : ACCENT_COLORS[0].value
                }

                if (Object.keys(updates).length > 0) {
                    set(updates)
                    get().applyTheme()
                }
            },
        }),
        {
            name: 'relay-theme-storage',
        }
    )
)

useAuthStore.subscribe((state) => {
    const settings = state.user?.settings
    if (settings) {
        const store = useThemeStore.getState()
        if (settings.theme) {
            const normalizedTheme: Theme = LEGACY_DARK_THEMES.includes(settings.theme) || settings.theme === 'dark' ? 'dark' : 'light'
            if (normalizedTheme !== store.theme) useThemeStore.setState({ theme: normalizedTheme })
            store.applyTheme()
        }
        if (settings.accent_color && settings.accent_color !== store.accentColor) {
            const normalizedAccent = ACCENT_COLORS.some((color) => color.value === settings.accent_color)
                ? settings.accent_color
                : ACCENT_COLORS[0].value
            useThemeStore.setState({ accentColor: normalizedAccent })
            store.applyTheme()
        }
    }
})
