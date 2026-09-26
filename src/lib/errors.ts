/**
 * Recognises the failure shapes that need a different response from the default one.
 */

/**
 * Tells a stale lazy chunk apart from an ordinary render error.
 *
 * A deploy replaces the hashed filenames in dist/assets. A tab that was open across that deploy
 * asks for a file that no longer exists, and no amount of re-rendering brings it back, because
 * the module graph in that tab still points at the old hash. Only a reload fixes it, so the UI
 * has to ask for one instead of offering "try again" that is guaranteed to fail again.
 *
 * Vite's own `vite:preloadError` covers the preload of the very first chunk, which fires before
 * React has rendered anything and so cannot be caught by an error boundary. main.tsx handles
 * that case separately, with a one reload guard so a genuinely missing chunk cannot loop.
 *
 * These strings come from the browser and the bundler rather than from one place, and they have
 * changed between browser versions, so this is a pattern list rather than an exact match. A false
 * positive only means the message suggests reloading, which is harmless. A false negative means
 * the user is offered a retry that will not work, which is worth accepting rather than guessing
 * at exact wording.
 */
export function isChunkLoadError(error: unknown): boolean {
    // React lets anything be thrown, including a plain object carrying a message, so reading
    // only `error.message` on a real Error would miss those. Stringifying an object gives
    // "[object Object]", which matches nothing and mislabels an update as a crash.
    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : typeof (error as { message?: unknown } | null | undefined)?.message === 'string'
                    ? (error as { message: string }).message
                    : String(error ?? '')

    return /dynamically imported module|importing a module script failed|loading chunk|chunkloaderror|failed to fetch/i.test(message)
}
