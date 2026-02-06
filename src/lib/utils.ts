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
    return format(d, 'dd-MM-yyyy')
}

export function formatDisplayDateTime(date: Date | string | number) {
    if (!date) return ''
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return format(d, 'dd-MM-yyyy HH:mm')
}
