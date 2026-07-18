import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

export type Theme = 'light' | 'sepia' | 'comfort' | 'dark' | 'midnight'

const ALL_THEMES: Theme[] = ['light', 'sepia', 'comfort', 'dark', 'midnight']

export interface AccentColor {
    key: string
    value: string // HSL values like "239 84% 67%"
}

export const ACCENT_COLORS: AccentColor[] = [
    { key: 'indigo', value: '239 84% 67%' },
    { key: 'sky', value: '199 89% 48%' },
    { key: 'emerald', value: '158 64% 52%' },
    { key: 'rose', value: '346 87% 57%' },
    { key: 'amber', value: '38 92% 50%' },
    { key: 'violet', value: '262 83% 58%' },
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
    sepia: '#f5efe2',
    comfort: '#1d1d22',
    dark: '#09090b',
    midnight: '#000000',
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            accentColor: '239 84% 67%',

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
                const idx = ALL_THEMES.indexOf(theme)
                const next = ALL_THEMES[(idx + 1) % ALL_THEMES.length]
                set({ theme: next })
                get().applyTheme()
            },

            applyTheme: () => {
                const { theme, accentColor } = get()
                const root = window.document.documentElement

                root.classList.remove(...ALL_THEMES)
                root.classList.add(theme)

                root.style.setProperty('--primary', accentColor)
                root.style.setProperty('--primary-foreground', '216 19% 4%')
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

                if (theme && (ALL_THEMES as string[]).includes(theme)) updates.theme = theme as Theme
                if (accent_color) updates.accentColor = accent_color

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
        if (settings.theme && (ALL_THEMES as string[]).includes(settings.theme) && settings.theme !== store.theme) {
            useThemeStore.setState({ theme: settings.theme as Theme })
            store.applyTheme()
        }
        if (settings.accent_color && settings.accent_color !== store.accentColor) {
            useThemeStore.setState({ accentColor: settings.accent_color })
            store.applyTheme()
        }
    }
})
