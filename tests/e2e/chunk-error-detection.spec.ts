import { test, expect } from '@playwright/test'

import { isChunkLoadError } from '../../src/lib/errors'

/**
 * The copy shown after a crash depends entirely on this function being right, and it is easy to
 * get wrong in the direction that strands the user: call it false for a stale chunk and the
 * fallback offers "try again", which re-runs the same failing import and shows the same screen
 * forever with no way out except finding the reload button.
 *
 * The exact wording comes from browsers and bundlers and has changed over time, so the cases
 * below are the real strings seen in the wild rather than one canonical message.
 */

test.describe('isChunkLoadError', () => {
    test('recognises the stale chunk shapes', () => {
        const stale = [
            // Chrome / Vite
            'Failed to fetch dynamically imported module: https://relay.example/assets/DashboardPage-B0ldH4sh.js',
            // Firefox
            'error loading dynamically imported module: https://relay.example/assets/DashboardPage-B0ldH4sh.js',
            // Safari
            'Importing a module script failed.',
            // webpack style, in case the bundler is ever swapped
            'Loading chunk 42 failed.',
            'ChunkLoadError: Loading chunk vendor-ui failed.',
            // Network level, reported bare by some browsers
            'Failed to fetch',
        ]

        for (const message of stale) {
            expect(isChunkLoadError(new Error(message)), message).toBe(true)
        }
    })

    test('accepts a thrown string, not just an Error', () => {
        expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(true)
        expect(isChunkLoadError({ message: 'Loading chunk 7 failed' })).toBe(true)
    })

    test('does not claim ordinary render errors are a chunk problem', () => {
        const ordinary = [
            'Cannot read properties of undefined (reading \'map\')',
            'Objects are not valid as a React child',
            'Minified React error #310',
            'The above error occurred in the <RosterMatrix> component',
            'permission-denied',
            'Firebase: Error (auth/too-many-requests).',
            '',
        ]

        for (const message of ordinary) {
            expect(isChunkLoadError(new Error(message)), message).toBe(false)
        }
    })

    test('handles values that are not errors at all', () => {
        expect(isChunkLoadError(null)).toBe(false)
        expect(isChunkLoadError(undefined)).toBe(false)
        expect(isChunkLoadError(0)).toBe(false)
        expect(isChunkLoadError({})).toBe(false)
    })

    test('an out of memory crash is not a chunk problem, and must not claim to be', () => {
        // This used to be in the pattern list. "Reload" is plausible advice for an OOM, but the
        // screen is a crash, not an update, and mislabelling it hides the real cause.
        expect(isChunkLoadError(new Error('Out of memory'))).toBe(false)
    })
})
