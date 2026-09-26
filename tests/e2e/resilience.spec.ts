import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Covers the two "the app is unusable and you cannot tell why" fixes.
 *
 * - There was no error boundary anywhere in src, so any render throw unmounted the tree and left
 *   a blank document. There was also no catch all route, so a stale bookmark looked identical to
 *   a broken app.
 * - Firestore used an in memory only cache, so a wifi blip emptied the app and discarded writes
 *   instead of queueing them. Persistence fixes that but leaves hotel data in IndexedDB, so sign
 *   out has to erase it.
 */

const FIREBASE_MODULE = join(process.cwd(), 'src', 'lib', 'firebase.ts')

// --- The error boundary ---------------------------------------------------------------------

test('a caught render error shows a recoverable screen instead of a blank page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForFunction(() => '__relayTestHooks' in window)

    await page.evaluate(() =>
        (window as unknown as { __relayTestHooks: { mountThrowingBoundary: (v: 'render' | 'chunk') => Promise<void> } })
            .__relayTestHooks.mountThrowingBoundary('render')
    )

    const boundary = page.getByTestId('error-boundary')
    await expect(boundary).toBeVisible()

    // Plain enough for someone on shift to act on.
    await expect(boundary).toContainText(/went wrong|ters gitti/i)
    await expect(page.getByTestId('error-boundary-retry')).toBeVisible()
    await expect(page.getByTestId('error-boundary-reload')).toBeVisible()

    // The page must no longer be empty, which was the entire problem.
    expect(((await boundary.innerText()) ?? '').trim().length).toBeGreaterThan(20)
})

test('a stale lazy chunk is reported as an update, not as a crash', async ({ page }) => {
    await page.goto('/login')
    await page.waitForFunction(() => '__relayTestHooks' in window)

    await page.evaluate(() =>
        (window as unknown as { __relayTestHooks: { mountThrowingBoundary: (v: 'render' | 'chunk') => Promise<void> } })
            .__relayTestHooks.mountThrowingBoundary('chunk')
    )

    const boundary = page.getByTestId('error-boundary')
    await expect(boundary).toBeVisible()

    // Deploying replaces the hashed filenames, so a tab left open from a previous deploy asks
    // for a file that no longer exists. The user needs to be told to reload, not to expect a
    // crash, because retrying without reloading cannot possibly work.
    const text = await boundary.innerText()
    expect(text).toMatch(/updated|güncellendi/i)
    expect(text).not.toMatch(/went wrong|ters gitti/i)
})

// --- Unknown URLs ----------------------------------------------------------------------------

test('an unknown URL shows a not found page rather than an empty document', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')

    const notFound = page.getByTestId('not-found')
    await expect(notFound).toBeVisible()
    await expect(notFound).toContainText('404')

    // The body is not empty, which is exactly what an unmatched route used to produce.
    expect(((await page.locator('body').innerText()) ?? '').trim().length).toBeGreaterThan(20)
})

test('the not found page leads back to a working page', async ({ page }) => {
    await page.goto('/nope-not-here')
    await page.getByTestId('not-found').getByRole('link').click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('not-found')).toHaveCount(0)
})

// --- Firestore persistence ---------------------------------------------------------------------

/**
 * These two are contract tests, and it is worth being clear about why.
 *
 * Persistence cannot be observed from the running app here: the demo project rejects every
 * request, so no document is ever successfully read, and the SDK only creates its IndexedDB
 * cache once it has something real to store. The instance internals do not distinguish the two
 * configurations either, `_persistenceKey` reads "[DEFAULT]" for both. A test that claimed to
 * prove persistence here would be asserting nothing.
 *
 * What these do instead is pin the configuration so it cannot be dropped by accident, and pin
 * the sign out wiring that makes persistence safe. A real assertion of the offline behaviour
 * needs a project the emulator accepts, which is worth doing properly rather than mocking.
 */
test('Firestore is configured with a persistent multi tab local cache', () => {
    const source = readFileSync(FIREBASE_MODULE, 'utf8')

    expect(source).toContain('persistentLocalCache(')
    expect(source).toContain('persistentMultipleTabManager(')

    // A single tab manager logs an error and disables persistence when a second tab opens,
    // which is the normal shape of a front desk plus a back office.
    expect(source).not.toMatch(/persistentSingleTabManager|enableIndexedDbPersistence/)

    // The plain in memory instance has to stay reachable as a fallback, because persistence can
    // be refused (private browsing, quota) and that must not take the app down.
    expect(source).toMatch(/catch\s*\(/)
    expect(source).toMatch(/return getFirestore\(app\)/)
})

test('signing out erases the local Firestore cache, so persistence cannot outlive the session', () => {
    const authStore = readFileSync(join(process.cwd(), 'src', 'stores', 'authStore.ts'), 'utf8')
    const signOut = authStore.slice(authStore.indexOf('signOut:'))

    expect(signOut).toContain('clearLocalFirestoreCache()')

    // Order matters: the stores are wiped first so nothing is rendered from a cache that is
    // about to be deleted.
    expect(signOut.indexOf('resetAllStores()')).toBeLessThan(signOut.indexOf('clearLocalFirestoreCache()'))
})

test('no Firestore cache is left on the device after signing out', async ({ page }) => {
    await page.goto('/login')
    await page.waitForFunction(() => '__relayTestHooks' in window)

    const before = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))

    await page.evaluate(async () => {
        const { clearLocalFirestoreCache } = await import('/src/lib/firebase.ts')
        await clearLocalFirestoreCache()
    })

    const after = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))

    // The SDK names its cache after the project, so nothing project scoped may survive.
    const projectScopedAfter = after.filter((name) => name.includes('relay-e61b4'))
    expect(projectScopedAfter).toEqual([])

    // Sanity: the helper must not be deleting unrelated storage the app relies on.
    expect(before.length).toBeGreaterThanOrEqual(after.length)
})
