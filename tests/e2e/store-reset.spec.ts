import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guards the sign-out wipe.
 *
 * Sign out used to clear three stores out of twenty, so the next account to sign in on the same
 * device could read the previous hotel's notes, sales, prices, DMs and announcements. These
 * tests stop that from coming back: the first two check every store is actually wired into
 * resetAllStores, the third checks the wipe really empties the state.
 */

const STORES_DIR = join(process.cwd(), 'src', 'stores')
const RESET_MODULE = join(STORES_DIR, 'resetAllStores.ts')

// Files in src/stores that hold no state of their own. resetAllStores is the wipe itself;
// devTestHooks just republishes the stores for tests.
const NOT_A_STORE = new Set(['resetAllStores', 'devTestHooks'])

const storeFiles = () => readdirSync(STORES_DIR)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => name.replace(/\.ts$/, ''))
    .filter((name) => !NOT_A_STORE.has(name))

// Stores that legitimately hold nothing hotel scoped. Mirrors STORES_WITHOUT_TENANT_DATA in
// resetAllStores.ts, and the test below asserts the two stay in step.
const EXEMPT = new Set([
    'authStore',
    'languageStore',
    'layoutStore',
    'navigationStore',
    'themeStore',
])

test('every store holding hotel data is wired into resetAllStores', () => {
    const source = readFileSync(RESET_MODULE, 'utf8')
    const missing = storeFiles().filter((name) => !EXEMPT.has(name) && !source.includes(`/${name}'`))

    expect(
        missing,
        `These stores are not referenced in resetAllStores.ts, so their data survives sign out: ${missing.join(', ')}`,
    ).toEqual([])
})

test('the exempt store list matches the module', () => {
    const source = readFileSync(RESET_MODULE, 'utf8')
    const declared = [...source.matchAll(/'(authStore|languageStore|layoutStore|navigationStore|themeStore)'/g)]
        .map((match) => match[1])

    expect(new Set(declared)).toEqual(EXEMPT)
})

test('resetAllStores clears hotel data, and leaves device preferences alone', async ({ page }) => {
    // The stores are only reachable from inside the app, where Vite has resolved import.meta.env.
    await page.goto('/login')
    await page.waitForFunction(() => '__relayStores' in window)

    const result = await page.evaluate(() => {
        const stores = (window as unknown as {
            __relayStores: Record<string, {
                getState: () => Record<string, unknown>
                setState: (partial: Record<string, unknown>) => void
            }>
        }).__relayStores
        const S = stores as unknown as Record<string, {
            getState: () => Record<string, unknown>
            setState: (partial: Record<string, unknown>) => void
        }>

        S.useHotelStore.setState({ hotel: { id: 'hotel-a' } })
        S.useNotesStore.setState({ notes: [{ id: 'n1' }] })
        S.useSalesStore.setState({ sales: [{ id: 's1' }] })
        S.usePricingStore.setState({ agencies: [{ id: 'a1' }], basePrices: { prices: {} } })
        S.useRosterStore.setState({ staff: [{ uid: 'u1' }], activeStaff: [{ uid: 'u1' }] })
        S.useAnnouncementStore.setState({
            announcements: [{ id: 'a1' }],
            receipts: { a1: { uid: 'u1' } },
            audience: { a1: { u1: { uid: 'u1' } } },
        })
        S.useMessageStore.setState({ messages: [{ id: 'm1' }] })
        S.useAIStore.setState({ result: 'answer built from hotel A notes' })
        S.useLogsStore.setState({ logs: [{ id: 'l1' }], pinnedLogs: [{ id: 'l1' }] })
        S.useRoomStore.setState({ rooms: [{ id: '101' }] })
        S.useNotificationStore.setState({ notifications: [{ id: 'no1' }], unreadCount: 3 })

        // Hotel scoped localStorage keys, and device preferences that must not be touched.
        localStorage.setItem('last_payment_check_hotel-a', '123')
        localStorage.setItem('relay-roster-view', 'week')
        localStorage.setItem('relay_show_datetime', 'false')

        const themeBefore = S.useThemeStore.getState().theme
        const languageBefore = S.useLanguageStore.getState().language

        S.resetAllStores()

        return {
            hotel: S.useHotelStore.getState().hotel,
            notes: S.useNotesStore.getState().notes,
            sales: S.useSalesStore.getState().sales,
            agencies: S.usePricingStore.getState().agencies,
            basePrices: S.usePricingStore.getState().basePrices,
            staff: S.useRosterStore.getState().staff,
            activeStaff: S.useRosterStore.getState().activeStaff,
            announcements: S.useAnnouncementStore.getState().announcements,
            receipts: S.useAnnouncementStore.getState().receipts,
            audience: S.useAnnouncementStore.getState().audience,
            messages: S.useMessageStore.getState().messages,
            aiResult: S.useAIStore.getState().result,
            logs: S.useLogsStore.getState().logs,
            pinnedLogs: S.useLogsStore.getState().pinnedLogs,
            rooms: S.useRoomStore.getState().rooms,
            notifications: S.useNotificationStore.getState().notifications,
            unreadCount: S.useNotificationStore.getState().unreadCount,
            paymentCheckKey: localStorage.getItem('last_payment_check_hotel-a'),
            rosterView: localStorage.getItem('relay-roster-view'),
            showDateTime: localStorage.getItem('relay_show_datetime'),
            themeKept: S.useThemeStore.getState().theme === themeBefore,
            languageKept: S.useLanguageStore.getState().language === languageBefore,
        }
    })

    // Gone: another tenant's data must not survive a sign out.
    expect(result.hotel).toBeNull()
    expect(result.notes).toEqual([])
    expect(result.sales).toEqual([])
    expect(result.agencies).toEqual([])
    expect(result.basePrices).toBeNull()
    expect(result.staff).toEqual([])
    expect(result.activeStaff).toEqual([])
    expect(result.announcements).toEqual([])
    expect(result.receipts).toEqual({})
    expect(result.audience).toEqual({})
    expect(result.messages).toEqual([])
    expect(result.aiResult).toBeNull()
    expect(result.logs).toEqual([])
    expect(result.pinnedLogs).toEqual([])
    expect(result.rooms).toEqual([])
    expect(result.notifications).toEqual([])
    expect(result.unreadCount).toBe(0)

    // Hotel scoped storage is swept, because it is keyed by hotel id.
    expect(result.paymentCheckKey).toBeNull()

    // Kept: these belong to the device, not the tenant. Sign out used to call
    // localStorage.clear(), which reset the language and every collapsed card.
    expect(result.rosterView).toBe('week')
    expect(result.showDateTime).toBe('false')
    expect(result.themeKept).toBe(true)
    expect(result.languageKept).toBe(true)
})
