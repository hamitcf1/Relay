import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, Translations } from '@/i18n/types'

export type { Language, Translations } from '@/i18n/types'

type TFn = (key: keyof Translations, params?: Record<string, string>) => string

const loaders: Record<Language, () => Promise<Translations>> = {
    en: () => import('@/i18n/en').then(m => m.default),
    tr: () => import('@/i18n/tr').then(m => m.default),
    ru: () => import('@/i18n/ru').then(m => m.default),
}

const cache: Partial<Record<Language, Translations>> = {}

interface LanguageState {
    language: Language
    ready: boolean
    setLanguage: (lang: Language) => void
    t: TFn
}

const persistedRaw = (() => {
    try {
        return JSON.parse(localStorage.getItem('relay-language') || 'null')
    } catch {
        return null
    }
})()
const persistedLanguage = persistedRaw?.state?.language
const initialLang: Language = persistedLanguage === 'en' || persistedLanguage === 'tr' || persistedLanguage === 'ru'
    ? persistedLanguage
    : 'tr'

// Build a NEW t function reference each time we want subscribers to re-render.
// zustand selectors only fire when the selected value changes; if t kept the
// same reference, components using `useLanguageStore(s => s.t)` would never
// re-render on language change.
function buildT(lang: Language): TFn {
    const messages = cache[lang] || cache.en
    return (key, params) => {
        let text = (messages?.[key] as string | undefined)
            ?? (cache.en?.[key] as string | undefined)
            ?? (key as string)
        if (params && typeof text === 'string') {
            Object.entries(params).forEach(([param, value]) => {
                text = text.replace(`{${param}}`, value)
            })
        }
        return text
    }
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: initialLang,
            ready: false,
            t: buildT(initialLang),
            setLanguage: async (lang) => {
                if (!cache[lang]) {
                    cache[lang] = await loaders[lang]()
                }
                set({ language: lang, ready: true, t: buildT(lang) })
                const authStore = (window as any).useAuthStore
                if (authStore) {
                    const { user, updateSettings } = authStore.getState()
                    if (user) updateSettings({ language: lang })
                }
            },
        }),
        {
            name: 'relay-language',
            partialize: (state) => ({ language: state.language }),
        }
    )
)

// Pre-load active language before app render. Call from main.tsx.
// Also pre-load English so fallback works for missing TR keys without delay.
export async function initLanguage(): Promise<void> {
    const lang = useLanguageStore.getState().language

    const loads: Promise<unknown>[] = []
    if (!cache[lang]) loads.push(loaders[lang]().then(m => { cache[lang] = m }))
    if (lang !== 'en' && !cache.en) loads.push(loaders.en().then(m => { cache.en = m }))
    await Promise.all(loads)

    useLanguageStore.setState({ ready: true, t: buildT(lang) })
}
