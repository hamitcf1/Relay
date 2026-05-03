import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'


import { tr, enUS } from 'date-fns/locale'
import { format } from 'date-fns'
import { useLanguageStore } from '@/stores/languageStore'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getDateLocale() {
    const { language } = useLanguageStore.getState()
    return language === 'tr' ? tr : enUS
}

export function formatDisplayDate(date: Date | string | number) {
    if (!date) return ''
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return String(date)
    return format(d, 'dd-MM-yyyy')
}

export function formatDisplayDateTime(date: Date | string | number) {
    if (!date) return ''
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return String(date)
    return format(d, 'dd-MM-yyyy HH:mm')
}
export function cleanAuthError(error: any, t: (key: any) => string) {
    const errorCode = error?.code || 'unknown'
    
    switch(errorCode) {
        case 'auth/invalid-email':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return t('auth.error.invalidCredentials')
        case 'auth/too-many-requests':
            return t('auth.error.tooManyRequests')
        case 'auth/email-already-in-use':
            return t('auth.error.emailInUse')
        case 'auth/weak-password':
            return t('auth.error.passwordLength')
        default:
            return error.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || t('auth.error.generic')
    }
}
