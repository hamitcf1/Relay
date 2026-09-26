/**
 * Development only test surface.
 *
 * Why this is its own module instead of living inside resetAllStores.ts: eight stores import
 * authStore, and authStore imports resetAllStores. Reading those bindings at module scope made
 * a cycle of authStore -> resetAllStores -> shiftStore -> authStore throw
 * "Cannot access 'useAuthStore' before initialization" and blank the whole app. Reading them
 * later, after every module has finished evaluating, is safe.
 *
 * main.tsx loads this with a dynamic import behind `import.meta.env.DEV`, so it is not part of
 * a production bundle. tests/e2e/store-reset.spec.ts drives it.
 */
import { resetAllStores } from './resetAllStores'
import { useActivityStore } from './activityStore'
import { useAIStore } from './aiStore'
import { useAnnouncementStore } from './announcementStore'
import { useBlacklistStore } from './blacklistStore'
import { useCalendarStore } from './calendarStore'
import { useChatStore } from './chatStore'
import { useCurrencyStore } from './currencyStore'
import { useFeedbackStore } from './feedbackStore'
import { useHotelStore } from './hotelStore'
import { useIncidentStore } from './incidentStore'
import { useLanguageStore } from './languageStore'
import { useLeaderboardStore } from './leaderboardStore'
import { useLogsStore } from './logsStore'
import { useMessageStore } from './messageStore'
import { useNavigationEditorStore } from './navigationEditorStore'
import { useNotesStore } from './notesStore'
import { useNotificationStore } from './notificationStore'
import { useOffDayStore } from './offDayStore'
import { usePricingStore } from './pricingStore'
import { useRoomStore } from './roomStore'
import { useRosterStore } from './rosterStore'
import { useSalesStore } from './salesStore'
import { useShiftStore } from './shiftStore'
import { useStaffMealStore } from './staffMealStore'
import { useThemeStore } from './themeStore'
import { useTourStore } from './tourStore'
import { useWorkspaceEditStore } from './workspaceEditStore'

export function installStoreTestHooks() {
    ;(window as unknown as Record<string, unknown>).__relayStores = {
        resetAllStores,
        useActivityStore, useAIStore, useAnnouncementStore, useBlacklistStore,
        useCalendarStore, useChatStore, useCurrencyStore, useFeedbackStore, useHotelStore,
        useIncidentStore, useLanguageStore, useLeaderboardStore, useLogsStore, useMessageStore,
        useNavigationEditorStore, useNotesStore, useNotificationStore, useOffDayStore,
        usePricingStore, useRoomStore, useRosterStore, useSalesStore, useShiftStore,
        useStaffMealStore, useThemeStore, useTourStore, useWorkspaceEditStore,
    }
}
