import type { LucideIcon } from 'lucide-react'
import {
    Activity, ArrowLeftRight, CalendarDays, CreditCard,
    Info, LayoutDashboard, Map, MessageCircle, NotebookPen,
    ShieldAlert, Users, DollarSign, Wrench,
} from 'lucide-react'

export type ModuleId =
    | 'overview' | 'notes' | 'personal-notes' | 'roster' | 'messaging' | 'feedback'
    | 'asset-management' | 'maintenance' | 'lostfound' | 'cards-loans'
    | 'hotel-tools' | 'hotel-info' | 'currency' | 'calendar' | 'menu' | 'blacklist'
    | 'pricing' | 'tours' | 'off-days' | 'sales'
    | 'team' | 'activity' | 'settings'

export type ModuleGroup = 'today' | 'operations' | 'tools' | 'management'
export type DashboardArea = 'overview' | 'operations'

/** Sidebar section order. Section membership is derived from each module's `group`, not from a layout. */
export const MODULE_GROUPS: readonly ModuleGroup[] = ['today', 'operations', 'tools', 'management']

export interface ModuleDefinition {
    id: ModuleId
    icon: LucideIcon
    group: ModuleGroup
    labelKey?: string
    labels: { tr: string; en: string; ru: string }
    /** Compact label for narrow surfaces such as the mobile bottom bar. */
    shortLabels?: { tr: string; en: string; ru: string }
    area: DashboardArea
    subTab?: string
    roles?: string[]
    primary?: boolean
}

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
    { id: 'overview', icon: LayoutDashboard, group: 'today', labels: { tr: 'Operasyon özeti', en: 'Operations overview', ru: 'Сводка операций' }, shortLabels: { tr: 'Özet', en: 'Home', ru: 'Обзор' }, area: 'overview', primary: true },
    { id: 'notes', icon: ArrowLeftRight, group: 'today', labels: { tr: 'Vardiya devri', en: 'Shift handover', ru: 'Передача смены' }, shortLabels: { tr: 'Devir', en: 'Handover', ru: 'Смена' }, area: 'overview', subTab: 'notes', primary: true },
    { id: 'personal-notes', icon: NotebookPen, group: 'today', labels: { tr: 'Kişisel notlar', en: 'Personal notes', ru: 'Личные заметки' }, shortLabels: { tr: 'Notlar', en: 'Notes', ru: 'Заметки' }, area: 'overview', subTab: 'personal-notes', primary: true },
    { id: 'roster', icon: CalendarDays, group: 'today', labels: { tr: 'Haftalık vardiya', en: 'Weekly roster', ru: 'График на неделю' }, shortLabels: { tr: 'Vardiya', en: 'Roster', ru: 'График' }, area: 'overview', subTab: 'roster', primary: true },
    { id: 'messaging', icon: MessageCircle, group: 'operations', labelKey: 'module.messaging', labels: { tr: 'Mesajlar', en: 'Messages', ru: 'Сообщения' }, area: 'operations', subTab: 'messaging', primary: true },
    { id: 'feedback', icon: ShieldAlert, group: 'operations', labelKey: 'module.complaints', labels: { tr: 'Şikâyetler', en: 'Complaints', ru: 'Жалобы' }, area: 'operations', subTab: 'feedback' },
    { id: 'asset-management', icon: Wrench, group: 'operations', labels: { tr: 'Bakım & Kayıp Eşya', en: 'Asset & Maintenance', ru: 'Сервис и имущество' }, shortLabels: { tr: 'Bakım', en: 'Assets', ru: 'Сервис' }, area: 'operations', subTab: 'asset-management' },
    { id: 'sales', icon: CreditCard, group: 'operations', labelKey: 'module.sales', labels: { tr: 'Satışlar', en: 'Sales', ru: 'Продажи' }, area: 'operations', subTab: 'sales' },
    { id: 'tours', icon: Map, group: 'operations', labelKey: 'module.tours', labels: { tr: 'Turlar', en: 'Tours', ru: 'Туры' }, area: 'operations', subTab: 'tours' },
    { id: 'hotel-tools', icon: Info, group: 'tools', labels: { tr: 'Otel Rehberi & Araçlar', en: 'Hotel Tools & Info', ru: 'Отель и инструменты' }, area: 'overview', subTab: 'hotel-tools' },
    { id: 'pricing', icon: DollarSign, group: 'management', labelKey: 'module.pricing_label', labels: { tr: 'Fiyatlar', en: 'Pricing', ru: 'Цены' }, area: 'operations', subTab: 'pricing' },
    { id: 'off-days', icon: CalendarDays, group: 'management', labelKey: 'module.offDays', labels: { tr: 'İzin günleri', en: 'Off days', ru: 'Выходные' }, area: 'operations', subTab: 'off-days' },
    { id: 'team', icon: Users, group: 'management', labelKey: 'module.team_label', labels: { tr: 'Ekip', en: 'Team', ru: 'Команда' }, area: 'operations', subTab: 'team' },
    { id: 'activity', icon: Activity, group: 'management', labelKey: 'module.activity', labels: { tr: 'Aktivite', en: 'Activity', ru: 'Активность' }, area: 'operations', subTab: 'activity', roles: ['gm'] },
] as const

export const DEFAULT_PRIMARY_IDS: ModuleId[] = ['overview', 'notes', 'personal-notes', 'roster', 'messaging']

/** The mobile bottom bar renders four module slots around the quick action button. */
export const MOBILE_SLOT_COUNT = 4

export const DEFAULT_MOBILE_IDS: ModuleId[] = ['overview', 'notes', 'personal-notes', 'roster']
