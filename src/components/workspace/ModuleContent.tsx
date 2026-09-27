import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { ModuleId } from '@/config/moduleRegistry'
import { ShiftNotes } from '@/components/notes/ShiftNotes'
import { RosterMatrix } from '@/components/roster/RosterMatrix'
import { AssetManagementModule, type AssetTab } from '@/components/operations/AssetManagementModule'
import { HotelToolsModule, type HotelToolTab } from '@/components/tools/HotelToolsModule'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { resolveNavigation } from '@/lib/navigation'

const MessagingPanel = lazy(() => import('@/components/messaging/MessagingPanel').then((m) => ({ default: m.MessagingPanel })))
const FeedbackSection = lazy(() => import('@/components/feedback/FeedbackSection').then((m) => ({ default: m.FeedbackSection })))
const SalesPanel = lazy(() => import('@/components/sales/SalesPanel').then((m) => ({ default: m.SalesPanel })))
const PricingPanel = lazy(() => import('@/components/pricing/PricingPanel').then((m) => ({ default: m.PricingPanel })))
const LeaderboardPanel = lazy(() => import('@/components/team/LeaderboardPanel').then((m) => ({ default: m.LeaderboardPanel })))
const ActivityLogPanel = lazy(() => import('@/components/activity/ActivityLogPanel').then((m) => ({ default: m.ActivityLogPanel })))
const HotelSettings = lazy(() => import('@/components/settings/HotelSettings').then((m) => ({ default: m.HotelSettings })))

interface ModuleContentProps {
    moduleId: ModuleId
    hotelId: string
    canEdit: boolean
    initialAddOpen?: boolean
}

export function ModuleContent({ moduleId, hotelId, canEdit, initialAddOpen }: ModuleContentProps) {
    const { language } = useLanguageStore()
    const role = useAuthStore((state) => state.user?.role)
    const navigation = useHotelStore((state) => state.hotel?.settings.navigation)
    const permitted = resolveNavigation(role, navigation).all.some((module) => module.id === moduleId)
    if (!permitted) {
        return <div className="grid min-h-48 place-items-center rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">{language === 'tr' ? 'Bu modüle erişim izniniz yok.' : language === 'ru' ? 'У вас нет доступа к этому модулю.' : 'You do not have access to this module.'}</div>
    }
    if (['notes', 'personal-notes'].includes(moduleId)) {
        return <ShiftNotes hotelId={hotelId} initialAddOpen={initialAddOpen} initialTab={moduleId === 'personal-notes' ? 'personal' : 'handover'} />
    }
    if (moduleId === 'roster') return <RosterMatrix hotelId={hotelId} canEdit={canEdit} />

    // Consolidated Asset & Maintenance Module
    if (['asset-management', 'maintenance', 'lostfound', 'cards-loans'].includes(moduleId)) {
        const tabMap: Record<string, AssetTab> = {
            'asset-management': 'maintenance',
            'maintenance': 'maintenance',
            'lostfound': 'lostfound',
            'cards-loans': 'cards-loans',
        }
        return <AssetManagementModule initialTab={tabMap[moduleId] || 'maintenance'} />
    }

    // Consolidated Hotel Tools & Info Module
    if (['hotel-tools', 'hotel-info', 'currency', 'calendar', 'menu', 'blacklist'].includes(moduleId)) {
        const tabMap: Record<string, HotelToolTab> = {
            'hotel-tools': 'hotel-info',
            'hotel-info': 'hotel-info',
            'currency': 'currency',
            'calendar': 'calendar',
            'menu': 'menu',
            'blacklist': 'blacklist',
        }
        return <HotelToolsModule hotelId={hotelId} canEdit={canEdit} initialTab={tabMap[moduleId] || 'hotel-info'} />
    }

    const content = moduleId === 'messaging' ? <MessagingPanel />
        : moduleId === 'settings' ? <HotelSettings />
            : (moduleId === 'sales' || moduleId === 'tours') ? <SalesPanel initialTab={moduleId === 'tours' ? 'tours' : 'sales'} />
                : moduleId === 'feedback' ? <FeedbackSection />
                    : (moduleId === 'team' || moduleId === 'off-days') ? <LeaderboardPanel initialTab={moduleId === 'off-days' ? 'off-days' : 'leaderboard'} />
                        : moduleId === 'pricing' ? <PricingPanel />
                            : moduleId === 'activity' ? <ActivityLogPanel />
                                : null
    return <Suspense fallback={<div className="grid min-h-48 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}>{content}</Suspense>
}
