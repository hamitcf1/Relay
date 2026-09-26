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
import { useAuthStore } from './authStore'
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
        useActivityStore, useAIStore, useAnnouncementStore, useAuthStore, useBlacklistStore,
        useCalendarStore, useChatStore, useCurrencyStore, useFeedbackStore, useHotelStore,
        useIncidentStore, useLanguageStore, useLeaderboardStore, useLogsStore, useMessageStore,
        useNavigationEditorStore, useNotesStore, useNotificationStore, useOffDayStore,
        usePricingStore, useRoomStore, useRosterStore, useSalesStore, useShiftStore,
        useStaffMealStore, useThemeStore, useTourStore, useWorkspaceEditStore,
    }
    ;(window as unknown as Record<string, unknown>).__relayTestHooks = { mountThrowingBoundary }
}

/**
 * Mounts an ErrorBoundary around a component that throws, so a test can see the fallback the
 * user would actually get.
 *
 * This lives here rather than in the spec because a spec runs in Playwright's Node context, where
 * `import.meta.env` is undefined and the module graph does not exist. In the browser the app has
 * already resolved everything, so a dynamic import works.
 *
 * `variant` picks the failure shape. 'chunk' is the one a deploy produces: the hashed filename in
 * dist/assets changed, so the tab asks for a file that is gone. The boundary has to say "the app
 * was updated" for that, not "something went wrong", because the action is different.
 */
async function mountThrowingBoundary(variant: 'render' | 'chunk') {
    const [React, { createRoot }, { ErrorBoundary }] = await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('@/components/ui/ErrorBoundary'),
    ])

    const message = variant === 'chunk'
        ? 'Failed to fetch dynamically imported module: https://relay.example/assets/DashboardPage-B0ldH4sh.js'
        : 'a render threw on purpose'

    const Boom = () => {
        throw new Error(message)
    }

    const host = document.createElement('div')
    host.id = `relay-throw-host-${variant}`
    host.style.minHeight = '100vh'
    document.body.appendChild(host)

    // React logs the caught error. The test asserts the fallback, not the console, so keep the
    // output readable without hiding anything a developer would want during a dev run.
    const originalError = console.error
    const originalWarn = console.warn
    if (variant === 'render') {
        console.error = () => { }
        console.warn = () => { }
    }

    createRoot(host).render(
        React.createElement(ErrorBoundary, null, React.createElement(Boom)),
    )

    await new Promise((resolve) => setTimeout(resolve, 250))
    console.error = originalError
    console.warn = originalWarn
}
