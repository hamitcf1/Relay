import { test, expect, type Page } from '@playwright/test'

import { enterDemo } from './helpers'

/**
 * Suite: Desktop notifications
 * Documentation: docs/qa/TEST_CASES.md
 *
 * What this file is for
 * --------------------
 * The request was that anything new should be able to raise a notification on the machine the
 * browser is running on, so a manager working in another window finds out without watching the
 * dashboard. That is a Web Notifications call, a preference to switch it on, and one decision about
 * what counts as new.
 *
 * The decision is the whole of the risk here. The list arrives from a subscription, so the first
 * delivery after opening the app already holds everything that accumulated since the last visit.
 * Announcing that would fire a burst of toasts at someone who had only opened the app, which is the
 * fastest way to get this switched off and left off. So the first delivery is a baseline and
 * nothing is raised from it, and the tests below spend most of their weight on that.
 *
 * How the notification is observed
 * -------------------------------
 * A real toast is drawn by the operating system and is not in the page, so `window.Notification` is
 * replaced before any application code runs with a recorder that keeps the arguments. Everything
 * under test is the real thing: the real store, the real subscription, the real hook, the real
 * preference. Only the platform's drawing is stood in for.
 */

declare global {
    interface Window {
        __relayStores?: Record<string, { getState: () => any; setState: (patch: any) => void }>
        __desktopToasts?: Array<{ title: string; body?: string; tag?: string; requireInteraction?: boolean }>
        /** Flips what the stubbed browser answers when permission is asked for. */
        __desktopPermissionAnswer?: 'granted' | 'denied' | 'default'
    }
}

/**
 * Installs the recorder. Must run before the application boots, so this is an init script rather
 * than an evaluate: the hook asks the browser its permission state on mount, and a stub installed
 * afterwards would read the real one.
 */
async function stubNotifications(page: Page) {
    await page.addInitScript(() => {
        window.__desktopToasts = []
        window.__desktopPermissionAnswer = 'granted'

        class RecordingNotification {
            static permission = 'granted'
            static requestPermission() {
                return Promise.resolve(window.__desktopPermissionAnswer)
            }
            title: string
            options: any
            constructor(title: string, options: any) {
                this.title = title
                this.options = options
                window.__desktopToasts!.push({
                    title,
                    body: options?.body,
                    tag: options?.tag,
                    requireInteraction: options?.requireInteraction,
                })
            }
        }
        ;(window as any).Notification = RecordingNotification
    })
}

/** Answers the permission request with `answer` and rewrites the browser's current state to match. */
async function setPermission(page: Page, answer: 'granted' | 'denied' | 'default' | 'unsupported') {
    await page.evaluate((answer) => {
        window.__desktopPermissionAnswer = answer === 'unsupported' ? 'default' : answer
        if (answer === 'unsupported') {
            // A browser with no Notification at all: an old engine, or a page on plain http.
            delete (window as any).Notification
        } else {
            ;(window as any).Notification.permission = answer
        }
    }, answer)
}

/**
 * Signs in as the manager with the recorder already installed.
 *
 * The stub is added before the first navigation so that it is in place when the shell mounts and
 * the hook reads its permission state. `enterDemo` then navigates, and the stub is re-installed by
 * the init script on that load, which resets the recorder to empty. Everything asserted below
 * happens after that, so nothing is lost.
 */
async function enterDemoWithStub(page: Page) {
    await stubNotifications(page)
    await enterDemo(page, 'Manager')
    // The notification subscription has to have delivered before the store can be driven, because
    // a delivery that lands after a seeded batch is merged with it.
    await page.waitForFunction(
        () => window.__relayStores?.useNotificationStore.getState().loaded === true,
        undefined,
        { timeout: 15000 },
    )
}

/** Turns the preference on without going through the switch, for the delivery tests. */
async function enablePreference(page: Page) {
    await page.evaluate(() => {
        const store = window.__relayStores!.useAuthStore
        const user = store.getState().user
        store.setState({ user: { ...user, settings: { ...user.settings, desktop_notifications: true } } })
    })
    // The hook reads the preference, so let the effect that depends on it run before delivering.
    await page.waitForFunction(
        () => window.__relayStores?.useAuthStore.getState().user?.settings?.desktop_notifications === true,
        undefined,
        { timeout: 5000 },
    )
}

function notification(id: string, overrides: Record<string, any> = {}) {
    return {
        id,
        type: 'message',
        title: `Title ${id}`,
        content: `Content ${id}`,
        timestamp: new Date(),
        is_read: false,
        ...overrides,
    }
}

/** Replaces the list and waits for the count to land, so assertions are not read mid-render. */
async function deliver(page: Page, items: any[]) {
    await page.evaluate((items) => {
        const store = window.__relayStores!.useNotificationStore
        store.setState({
            notifications: items,
            unreadCount: items.filter((n: any) => !n.is_read).length,
        })
    }, items)
    await page.waitForFunction(
        (expected) => window.__relayStores?.useNotificationStore.getState().notifications.length === expected,
        items.length,
        { timeout: 5000 },
    )
}

function toasts(page: Page) {
    return page.evaluate(() => window.__desktopToasts ?? [])
}

test.describe('Desktop notifications', () => {
    test('opening the app with the preference already on does not announce what is already there', async ({ page }) => {
        await enterDemoWithStub(page)
        await enablePreference(page)

        // Leave the shell, so the hook unmounts and comes back with an empty tally, and empty the
        // store while it is gone. The remount therefore begins in the state a real page load begins
        // in: mounted, the store holding nothing yet, and no subscription having answered. The
        // preference is already on, which is the case that matters, because the user asked for
        // these and a burst on arrival is what they would notice first.
        await openNotificationsPage(page)
        await page.evaluate(() => {
            window.__relayStores!.useNotificationStore.setState({
                notifications: [],
                unreadCount: 0,
                loaded: false,
            })
        })
        await page.getByRole('button', { name: /Geri|Back|Назад/i }).click()
        await expect(page).toHaveURL(/\/dashboard|\/operations/, { timeout: 15000 })

        // The bell's own subscription answers the remount with the two demo fixtures. Those are
        // the first thing that arrives, so they are the baseline and nothing is raised for them.
        //
        // This assertion is the one that fails without the store's `loaded` flag. With the store
        // empty and no answer yet, a hook cannot tell "nothing has arrived" from "nothing is
        // there", primes on the empty list, and then announces the entire first batch the moment
        // the app opens.
        await page.waitForFunction(
            () => {
                const state = window.__relayStores?.useNotificationStore.getState()
                return state?.loaded === true
                    && state.notifications.some((n: any) => n.id === 'demo-fixture-welcome')
            },
            undefined,
            { timeout: 15000 },
        )
        expect(await toasts(page)).toEqual([])

        // The next one is genuinely new, and the same session that swallowed the baseline should
        // announce it. Without this the assertion above would also pass on a hook that never fires.
        const current = await page.evaluate(
            () => window.__relayStores!.useNotificationStore.getState().notifications,
        )
        await deliver(page, [...current, notification('arrived-later')])
        const after = await toasts(page)
        expect(after).toHaveLength(1)
        expect(after[0].title).toBe('Title arrived-later')
    })

    test('a batch that arrives together is announced once per notification', async ({ page }) => {
        await enterDemoWithStub(page)
        await enablePreference(page)

        const current = await page.evaluate(
            () => window.__relayStores!.useNotificationStore.getState().notifications,
        )
        const arrived = [notification('batch-1'), notification('batch-2'), notification('batch-3')]
        await deliver(page, [...current, ...arrived])

        const after = await toasts(page)
        expect(after.map((t) => t.title).sort()).toEqual(
            ['Title batch-1', 'Title batch-2', 'Title batch-3'],
        )
    })

    test('nothing is raised while the preference is off', async ({ page }) => {
        await enterDemoWithStub(page)

        const current = await page.evaluate(
            () => window.__relayStores!.useNotificationStore.getState().notifications,
        )
        await deliver(page, [...current, notification('quiet-1'), notification('quiet-2')])

        expect(await toasts(page)).toEqual([])
    })

    test('a notification that is already read is not announced', async ({ page }) => {
        await enterDemoWithStub(page)
        await enablePreference(page)

        const current = await page.evaluate(
            () => window.__relayStores!.useNotificationStore.getState().notifications,
        )
        await deliver(page, [
            ...current,
            notification('read-one', { is_read: true }),
            notification('unread-one'),
        ])

        const after = await toasts(page)
        expect(after).toHaveLength(1)
        expect(after[0].title).toBe('Title unread-one')
    })

    test('money owed stays on screen; everything else is a glance', async ({ page }) => {
        await enterDemoWithStub(page)
        await enablePreference(page)

        const current = await page.evaluate(
            () => window.__relayStores!.useNotificationStore.getState().notifications,
        )
        await deliver(page, [
            ...current,
            notification('owed', { type: 'payment', title: 'Owed 45 EUR' }),
            notification('chatter', { type: 'message', title: 'A message' }),
        ])

        const after = await toasts(page)
        const owed = after.find((t) => t.tag === 'owed')
        const chatter = after.find((t) => t.tag === 'chatter')
        expect(owed?.requireInteraction).toBe(true)
        expect(chatter?.requireInteraction).toBe(false)
    })

    test('the same notification twice does not stack up two toasts', async ({ page }) => {
        await enterDemoWithStub(page)
        await enablePreference(page)

        const current = await page.evaluate(
            () => window.__relayStores!.useNotificationStore.getState().notifications,
        )
        const one = notification('repeat', { title: 'Same thing' })
        await deliver(page, [...current, one])
        // Re-delivered by a snapshot with nothing changed, which is what the subscription does on
        // any unrelated write elsewhere in the hotel.
        await deliver(page, [...current, one])

        const after = await toasts(page)
        expect(after).toHaveLength(1)
        // The tag is the notification id, so the platform collapses a repeat rather than stacking.
        expect(after[0].tag).toBe('repeat')
    })

    test('a browser with no notifications at all is said so, and the switch is disabled', async ({ page }) => {
        await enterDemoWithStub(page)
        await setPermission(page, 'unsupported')
        await openAppearance(page)

        const setting = page.getByTestId('desktop-notification-setting')
        await expect(setting).toContainText(UNSUPPORTED)
        await expect(setting.getByRole('button')).toBeDisabled()
    })

    test('the switch asks the browser, and only records the preference once the browser agrees', async ({ page }) => {
        await enterDemoWithStub(page)
        await setPermission(page, 'default')
        await openAppearance(page)

        const toggle = page.getByTestId('desktop-notification-setting').getByRole('button')
        await expect(toggle).toHaveAttribute('aria-pressed', 'false')
        await expect(page.getByTestId('desktop-notification-setting')).toContainText(WILL_ASK)

        // The browser says yes.
        await setPermission(page, 'granted')
        await toggle.click()

        await expect.poll(() => preference(page)).toBe(true)
        await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    })

    test('a refusal leaves the switch off rather than promising something that cannot happen', async ({ page }) => {
        await enterDemoWithStub(page)
        await setPermission(page, 'denied')
        await openAppearance(page)

        const toggle = page.getByTestId('desktop-notification-setting').getByRole('button')
        await toggle.click()

        // The important part: not recorded as on. A switch reading "on" while the browser refuses
        // every notification is worse than an honest off, because nothing would ever arrive and
        // there would be no sign of why.
        expect(await preference(page)).not.toBe(true)
        await expect(toggle).toHaveAttribute('aria-pressed', 'false')
        await expect(page.getByTestId('desktop-notification-setting')).toContainText(BLOCKED)
    })

    test('a permission withdrawn in the browser afterwards is reported next to the switch', async ({ page }) => {
        await enterDemoWithStub(page)
        await enablePreference(page)
        // The account still wants them; the browser no longer agrees.
        await setPermission(page, 'denied')
        await openAppearance(page)

        const setting = page.getByTestId('desktop-notification-setting')
        await expect(setting).toContainText(BLOCKED)
        await expect(setting).toContainText(BLOCKED_HINT)
    })
})

/**
 * Opens the personal preferences panel from the avatar menu.
 *
 * The avatar's accessible name is not the same on both layouts: the desktop header shows the
 * person's name, while the mobile header replaces it with "Profil" because there is no room for
 * the name. Matching only one of them makes this file pass on chromium and fail on a phone, which
 * is the same blind spot that let the notifications page ship a control with no name on mobile.
 */
async function openAppearance(page: Page) {
    await page.getByRole('button', { name: /Demo Manager|Profil|Profile|Профиль/i }).first().click()
    await page.getByRole('menuitem', { name: /Appearance|Görünüm|Внешний вид/i }).click()
    await expect(page.getByRole('dialog', { name: /Appearance|Görünüm|Внешний вид/i })).toBeVisible()
}

/**
 * Reaches the notifications page from the badge, which unmounts the shell the desktop notification
 * hook lives in. The demo session survives because this is the app's own navigation, not a page
 * load, and the hook comes back with an empty tally the next time the shell mounts.
 */
async function openNotificationsPage(page: Page) {
    await page.getByRole('button', { name: /Bildirimler|Notifications|Уведомления/i }).first().click()
    await page.getByText(/Tüm Bildirimleri Gör|View All Notifications|Все уведомления/).click()
    await expect(page).toHaveURL(/\/notifications$/, { timeout: 15000 })
    await page.waitForFunction(
        () => window.__relayStores?.useNotificationStore.getState().loaded === true,
        undefined,
        { timeout: 15000 },
    )
}

/** The stored preference, read back from the account rather than from the switch. */
function preference(page: Page) {
    return page.evaluate(
        () => window.__relayStores?.useAuthStore.getState().user?.settings?.desktop_notifications,
    )
}

/**
 * What the panel says, in every language it ships in.
 *
 * The demo runs in Turkish, so an English-only assertion here fails against correct code, which is
 * worse than no assertion: it teaches whoever reads the failure that the copy is wrong. Each
 * pattern is the three real sentences for one key.
 */
const UNSUPPORTED = /desteklemiyor|does not support|не поддерживает/i
const WILL_ASK = /izin isteyecek|will ask for permission|запросит разрешение/i
const BLOCKED = /izin vermiyor|not allowing|не разрешает/i
const BLOCKED_HINT = /Tarayıcı ayarlarından|browser settings|настройках браузера/i
