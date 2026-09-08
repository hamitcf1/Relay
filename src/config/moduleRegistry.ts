import type { LucideIcon } from 'lucide-react'
import {
    Activity, ArrowLeftRight, CalendarDays, CircleDollarSign, CreditCard,
    Info, KeyRound, LayoutDashboard, Map, MessageCircle, Settings,
    ShieldAlert, ShieldCheck, Utensils, UserX, Users, DollarSign,
} from 'lucide-react'

export type ModuleId =
    | 'overview' | 'notes' | 'roster' | 'messaging' | 'compliance' | 'feedback'
    | 'hotel-info' | 'currency' | 'calendar' | 'menu' | 'blacklist'
    | 'cards-loans' | 'pricing' | 'tours' | 'off-days' | 'sales'
    | 'team' | 'activity' | 'settings'

export type ModuleGroup = 'today' | 'operations' | 'tools' | 'management'
export type DashboardArea = 'overview' | 'operations'

export interface ModuleDefinition {
    id: ModuleId
    icon: LucideIcon
    group: ModuleGroup
    labelKey?: string
    labels: { tr: string; en: string; ru: string }
    area: DashboardArea
    subTab?: string
    roles?: string[]
    primary?: boolean
}

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
    { id: 'overview', icon: LayoutDashboard, group: 'today', labels: { tr: 'Operasyon özeti', en: 'Operations overview', ru: 'Сводка операций' }, area: 'overview', primary: true },
    { id: 'notes', icon: ArrowLeftRight, group: 'today', labels: { tr: 'Vardiya devri', en: 'Shift handover', ru: 'Передача смены' }, area: 'overview', subTab: 'notes', primary: true },
    { id: 'roster', icon: CalendarDays, group: 'today', labels: { tr: 'Haftalık vardiya', en: 'Weekly roster', ru: 'График на неделю' }, area: 'overview', subTab: 'roster', primary: true },
    { id: 'messaging', icon: MessageCircle, group: 'operations', labelKey: 'module.messaging', labels: { tr: 'Mesajlar', en: 'Messages', ru: 'Сообщения' }, area: 'operations', subTab: 'messaging', primary: true },
    { id: 'compliance', icon: ShieldCheck, group: 'operations', labelKey: 'module.compliance', labels: { tr: 'Uyumluluk', en: 'Compliance', ru: 'Соответствие' }, area: 'operations', subTab: 'compliance' },
    { id: 'feedback', icon: ShieldAlert, group: 'operations', labelKey: 'module.complaints', labels: { tr: 'Şikâyetler', en: 'Complaints', ru: 'Жалобы' }, area: 'operations', subTab: 'feedback' },
    { id: 'sales', icon: CreditCard, group: 'operations', labelKey: 'module.sales', labels: { tr: 'Satışlar', en: 'Sales', ru: 'Продажи' }, area: 'operations', subTab: 'sales' },
    { id: 'tours', icon: Map, group: 'operations', labelKey: 'module.tours', labels: { tr: 'Turlar', en: 'Tours', ru: 'Туры' }, area: 'operations', subTab: 'tours' },
    { id: 'cards-loans', icon: KeyRound, group: 'operations', labelKey: 'module.cards-loans', labels: { tr: 'Kart ve ödünç', en: 'Cards & loans', ru: 'Карты и займы' }, area: 'operations', subTab: 'cards-loans' },
    { id: 'hotel-info', icon: Info, group: 'tools', labelKey: 'module.hotelInfo', labels: { tr: 'Otel bilgileri', en: 'Hotel information', ru: 'Информация об отеле' }, area: 'overview', subTab: 'hotel-info' },
    { id: 'currency', icon: CircleDollarSign, group: 'tools', labelKey: 'module.currencyConverter', labels: { tr: 'Kur çevirici', en: 'Currency converter', ru: 'Конвертер валют' }, area: 'overview', subTab: 'currency' },
    { id: 'calendar', icon: CalendarDays, group: 'tools', labelKey: 'module.calendar', labels: { tr: 'Takvim', en: 'Calendar', ru: 'Календарь' }, area: 'overview', subTab: 'calendar' },
    { id: 'menu', icon: Utensils, group: 'tools', labelKey: 'menu.title', labels: { tr: 'Personel menüsü', en: 'Staff menu', ru: 'Меню персонала' }, area: 'overview', subTab: 'menu' },
    { id: 'blacklist', icon: UserX, group: 'tools', labelKey: 'blacklist.title', labels: { tr: 'Kara liste', en: 'Restricted guests', ru: 'Чёрный список' }, area: 'overview', subTab: 'blacklist' },
    { id: 'pricing', icon: DollarSign, group: 'management', labelKey: 'module.pricing_label', labels: { tr: 'Fiyatlar', en: 'Pricing', ru: 'Цены' }, area: 'operations', subTab: 'pricing' },
    { id: 'off-days', icon: CalendarDays, group: 'management', labelKey: 'module.offDays', labels: { tr: 'İzin günleri', en: 'Off days', ru: 'Выходные' }, area: 'operations', subTab: 'off-days' },
    { id: 'team', icon: Users, group: 'management', labelKey: 'module.team_label', labels: { tr: 'Ekip', en: 'Team', ru: 'Команда' }, area: 'operations', subTab: 'team' },
    { id: 'activity', icon: Activity, group: 'management', labelKey: 'module.activity', labels: { tr: 'Aktivite', en: 'Activity', ru: 'Активность' }, area: 'operations', subTab: 'activity', roles: ['gm'] },
    { id: 'settings', icon: Settings, group: 'management', labelKey: 'module.setting', labels: { tr: 'Ayarlar', en: 'Settings', ru: 'Настройки' }, area: 'operations', subTab: 'settings', roles: ['gm'] },
] as const

export const DEFAULT_PRIMARY_IDS: ModuleId[] = ['overview', 'notes', 'roster', 'messaging']
