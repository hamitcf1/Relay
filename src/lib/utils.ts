import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'


import { tr, enUS } from 'date-fns/locale'
import { useLanguageStore } from '@/stores/languageStore'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getDateLocale() {
    const { language } = useLanguageStore.getState()
    return language === 'tr' ? tr : enUS
}
