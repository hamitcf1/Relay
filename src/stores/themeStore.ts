import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
            },

            setAccentColor: (accentColor) => {
                set({ accentColor })
                get().applyTheme()
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark'
                set({ theme: newTheme })
                get().applyTheme()
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
            }
        }),
        {
            name: 'relay-theme-storage',
        }
    )
)
