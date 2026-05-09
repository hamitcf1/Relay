import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, Translations } from '@/i18n/types'

export type { Language, Translations } from '@/i18n/types'

const loaders: Record<Language, () => Promise<Translations>> = {
    en: () => import('@/i18n/en').then(m => m.default),
    tr: () => import('@/i18n/tr').then(m => m.default),
}

const cache: Partial<Record<Language, Translations>> = {}

interface LanguageState {
    language: Language
    ready: boolean
    setLanguage: (lang: Language) => void
    t: (key: keyof Translations, params?: Record<string, string>) => string
}

const persistedRaw = (() => {
    try {
        return JSON.parse(localStorage.getItem('relay-language') || 'null')
    } catch {
        return null
    }
})()
const initialLang: Language = persistedRaw?.state?.language === 'en' ? 'en' : 'tr'

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: initialLang,
            ready: false,
            setLanguage: async (lang) => {
                if (!cache[lang]) {
                    cache[lang] = await loaders[lang]()
                }
                set({ language: lang, ready: true })
                const authStore = (window as any).useAuthStore
                if (authStore) {
                    const { user, updateSettings } = authStore.getState()
                    if (user) updateSettings({ language: lang })
                }
            },
            t: (key, params) => {
                const lang = get().language
                const messages = cache[lang] || cache.en
                let text = (messages?.[key] as string | undefined)
                    ?? (cache.en?.[key] as string | undefined)
                    ?? key

                if (params && typeof text === 'string') {
                    Object.entries(params).forEach(([param, value]) => {
                        text = text.replace(`{${param}}`, value)
                    })
                }
                return text
            },
        }),
        {
            name: 'relay-language',
            partialize: (state) => ({ language: state.language }),
        }
    )
)

// Pre-load active language before app render. Call from main.tsx.
export async function initLanguage(): Promise<void> {
    const lang = useLanguageStore.getState().language
    if (!cache[lang]) {
        cache[lang] = await loaders[lang]()
    }
    useLanguageStore.setState({ ready: true })
}
