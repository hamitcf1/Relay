import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'en' | 'tr'

type Translations = {
    // Dashboard
    'dashboard.welcome': string
    'dashboard.role': string
    'dashboard.startShift': string
    'dashboard.endShift': string
    'dashboard.actions': string

    // Status
    'status.active': string
    'status.resolved': string
    'status.archived': string

    // Modules
    'module.activityFeed': string
    'module.stickyBoard': string
    'module.compliance': string
    'module.shiftNotes': string
    'module.hotelInfo': string
    'module.roster': string
    'module.calendar': string

    // Categories
    'category.handover': string
    'category.damage': string
    'category.guestInfo': string
    'category.earlyCheckout': string
    'category.other': string

    // Common
    'common.add': string
    'common.cancel': string
    'common.save': string
    'common.delete': string
    'common.edit': string
    'common.viewAll': string
    'common.loading': string
    'common.room': string
    'common.amount': string
}

const translations: Record<Language, Translations> = {
    en: {
        'dashboard.welcome': 'Welcome back, {name}',
        'dashboard.role': 'Role: {role}',
        'dashboard.startShift': 'Start Shift',
        'dashboard.endShift': 'End Shift',
        'dashboard.actions': 'Actions',

        'status.active': 'Active',
        'status.resolved': 'Resolved',
        'status.archived': 'Archived',

        'module.activityFeed': 'Live Activity Feed',
        'module.stickyBoard': 'Sticky Board',
        'module.compliance': 'Compliance Checklist',
        'module.shiftNotes': 'Shift Notes',
        'module.hotelInfo': 'Hotel Information',
        'module.roster': 'Staff Roster',
        'module.calendar': 'Calendar',

        'category.handover': 'Handover',
        'category.damage': 'Damage',
        'category.guestInfo': 'Guest Info',
        'category.earlyCheckout': 'Early Checkout',
        'category.other': 'Other',

        'common.add': 'Add',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.viewAll': 'View All',
        'common.loading': 'Loading...',
        'common.room': 'Room',
        'common.amount': 'Amount',
    },
    tr: {
        'dashboard.welcome': 'Hoşgeldin, {name}',
        'dashboard.role': 'Rol: {role}',
        'dashboard.startShift': 'Vardiya Başlat',
        'dashboard.endShift': 'Vardiyayı Bitir',
        'dashboard.actions': 'İşlemler',

        'status.active': 'Aktif',
        'status.resolved': 'Çözüldü',
        'status.archived': 'Arşiv',

        'module.activityFeed': 'Canlı Aktivite Akışı',
        'module.stickyBoard': 'Önemli Notlar',
        'module.compliance': 'Uyumluluk Kontrolü',
        'module.shiftNotes': 'Vardiya Notları',
        'module.hotelInfo': 'Otel Bilgileri',
        'module.roster': 'Personel Çizelgesi',
        'module.calendar': 'Takvim',

        'category.handover': 'Devir Teslim',
        'category.damage': 'Hasar / Ödeme',
        'category.guestInfo': 'Misafir Bilgi',
        'category.earlyCheckout': 'Erken Çıkış',
        'category.other': 'Diğer',

        'common.add': 'Ekle',
        'common.cancel': 'İptal',
        'common.save': 'Kaydet',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.viewAll': 'Tümünü Gör',
        'common.loading': 'Yükleniyor...',
        'common.room': 'Oda',
        'common.amount': 'Tutar',
    }
}

interface LanguageState {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: keyof Translations, params?: Record<string, string>) => string
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),
            t: (key, params) => {
                const lang = get().language
                // Fallback to English if translation missing in TR
                let text = translations[lang][key] || translations['en'][key] || key

                if (params) {
                    Object.entries(params).forEach(([param, value]) => {
                        text = text.replace(`{${param}}`, value)
                    })
                }

                return text
            }
        }),
        {
            name: 'relay-language', // key in localStorage
            partialize: (state) => ({ language: state.language }), // only persist language
        }
    )
)
