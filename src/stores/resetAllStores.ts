/**
 * Wipes every hotel scoped store on sign out.
 *
 * Why this is its own module: sign out used to clear three stores out of twenty, so the next
 * account to log in on the same device could briefly render the previous hotel's notes, sales,
 * prices, private messages and announcements before the first snapshot arrived. `aiStore.result`
 * was the worst case, because a generated answer built from hotel A's context stayed readable
 * after switching to hotel B.
 *
 * Every value below is that store's own documented initial state, so a signed out app looks
 * exactly like a freshly loaded one.
 *
 * Device preferences (theme, language, layout) are deliberately NOT reset. They belong to the
 * device, not the tenant, and wiping them on every sign out is its own bug.
 *
 * If you add a new store under src/stores, add it here too. `tests/unit/store-reset.test.ts`
 * fails when a store file is missing from this list, so the gap cannot go unnoticed.
 */
import { useActivityStore } from './activityStore'
import { useAIStore, } from './aiStore'
import { useAnnouncementStore, clearAnnouncementDemoViewer } from './announcementStore'
import { useBlacklistStore } from './blacklistStore'
import { useCalendarStore } from './calendarStore'
import { useChatStore } from './chatStore'
import { useCurrencyStore } from './currencyStore'
import { useFeedbackStore } from './feedbackStore'
import { useHotelStore } from './hotelStore'
import { useIncidentStore } from './incidentStore'
import { useLeaderboardStore } from './leaderboardStore'
import { useLogsStore } from './logsStore'
import { useMessageStore } from './messageStore'
import { useNavigationEditorStore } from './navigationEditorStore'
import { useNotesStore } from './notesStore'
import { useNotificationStore, clearNotificationDemoAudience } from './notificationStore'
import { useOffDayStore } from './offDayStore'
import { usePricingStore } from './pricingStore'
import { useRoomStore } from './roomStore'
import { useRosterStore } from './rosterStore'
import { useSalesStore } from './salesStore'
import { useShiftStore } from './shiftStore'
import { useStaffMealStore } from './staffMealStore'
import { useTourStore } from './tourStore'
import { useWorkspaceEditStore } from './workspaceEditStore'

/** Store files that hold no hotel data and therefore need no reset. */
export const STORES_WITHOUT_TENANT_DATA = new Set([
    'authStore',      // the account being signed out
    'languageStore',  // device preference
    'layoutStore',    // device preference
    'navigationStore',// device preference
    'themeStore',     // device preference
])

/**
 * localStorage prefixes that hold per hotel state, so they must go on sign out.
 *
 * Sign out used to call localStorage.clear() instead, which also wiped language, theme, layout,
 * collapsed card state and the roster view mode. Those belong to the device: wiping them made
 * every sign out visibly rearrange the app, and it reached into Firebase's own auth
 * persistence, which the SDK manages itself. No store persists hotel data, so a targeted sweep
 * of these prefixes is both sufficient and safe.
 */
const HOTEL_SCOPED_STORAGE_PREFIXES = [
    'last_payment_check_', // useDuePaymentNotifier, keyed by hotel id. Holds the last reported
                            // outstanding amount per sale, so wiping it makes the next session
                            // announce the current debts again.
]

function clearHotelScopedStorage() {
    if (typeof localStorage === 'undefined') return
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && HOTEL_SCOPED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
            doomed.push(key)
        }
    }
    for (const key of doomed) localStorage.removeItem(key)
}

export function resetAllStores() {
    useHotelStore.setState({ hotel: null, error: null, loading: true })
    useNotificationStore.setState({ notifications: [], unreadCount: 0, error: null, loading: true, loaded: false })
    clearNotificationDemoAudience()

    useShiftStore.setState({ currentShift: null, error: null, loading: true })
    useRosterStore.setState({
        staff: [], activeStaff: [], schedule: {},
        draft: null, draftSaving: false, draftConflict: null,
        error: null, loading: true,
    })
    useNavigationEditorStore.setState({ draft: null, dirty: false, loadedHotelId: undefined })
    useWorkspaceEditStore.getState().clear()

    useNotesStore.setState({ notes: [], error: null, loading: true })
    useSalesStore.setState({ sales: [], error: null, loading: true, loaded: false })
    useRoomStore.setState({ rooms: [], error: null, loading: true })
    useCalendarStore.setState({ events: [], error: null, loading: true })
    useOffDayStore.setState({ requests: [], error: null, loading: true })
    useTourStore.setState({ tours: [], error: null, loading: true })
    useBlacklistStore.setState({ blacklistedGuests: [], error: null, loading: false })
    useStaffMealStore.setState({ todayMenu: null, error: null, loading: true })
    usePricingStore.setState({ basePrices: null, baseOverrides: [], agencies: [], error: null, loading: false })
    useLeaderboardStore.setState({ entries: [], error: null, loading: false, timeRange: 'week' })
    useCurrencyStore.setState({ rates: null, lastUpdated: null, error: null, loading: false, connectionSuccessful: null })

    useLogsStore.setState({ logs: [], pinnedLogs: [], hotelId: null, error: null, loading: true })
    useIncidentStore.setState({ incidents: [], error: null, loading: true })
    useFeedbackStore.setState({ complaints: [], error: null, loading: true })
    useActivityStore.setState({ logs: [], loading: false })

    useAnnouncementStore.setState({ announcements: [], receipts: {}, audience: {}, error: null, loading: true })
    clearAnnouncementDemoViewer()
    useMessageStore.setState({ messages: [], error: null, loading: true })

    useChatStore.setState({ threads: [], activeThreadId: null, loading: false })
    useAIStore.setState({ result: null, error: null, loading: false, currentKeyIndex: 0 })

    clearHotelScopedStorage()
}
