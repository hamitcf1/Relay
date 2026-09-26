import * as React from 'react'
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isChunkLoadError } from '@/lib/errors'
import { useLanguageStore } from '@/stores/languageStore'

/**
 * Catches a render throw and shows a recoverable screen instead of a blank page.
 *
 * There was no boundary anywhere in the app, so a single render error anywhere below this
 * unmounted the whole tree and left the user staring at an empty document with no way forward
 * and nothing in the UI to report. Staff in the middle of a shift could not even screenshot a
 * description of what went wrong.
 *
 * Two cases are handled differently, because the right response differs:
 *
 * - A lazily loaded chunk that no longer exists. Deploying replaces the hashed filenames in
 *   dist/assets, so a tab left open from a previous deploy asks for a file that is gone. No
 *   amount of re-rendering helps; only a reload fetches the new index. main.tsx also listens for
 *   Vite's `vite:preloadError`, which fires for the preload of the very first chunk.
 * - Any other render error. Re-rendering the children is often enough, because most transient
 *   causes (a store caught mid sign out, a data shape that briefly lacks a field) are gone by
 *   the time the user clicks.
 *
 * Mount this twice on purpose: once inside the router, keyed by pathname, so navigating away
 * from a broken page clears the error, and once in main.tsx to catch failures thrown by the
 * providers above the router. The outer fallback therefore cannot use router links, which is
 * why both fallbacks are plain buttons.
 */

type Props = {
    children: React.ReactNode
    /** Shown instead of the default screen. Receives the error and the retry handler. */
    fallback?: (error: Error, reset: () => void) => React.ReactNode
    /** Changing this value clears a caught error, e.g. `key={location.pathname}`. */
    resetKeys?: unknown[]
}

type State = {
    error: Error | null
}

/**
 * Compares two reset key lists.
 *
 * The separator is a NUL written as an escape rather than a literal byte, for two reasons: a
 * literal NUL makes the file read as binary to grep and file, and no path or id contains one, so
 * two different lists can never join to the same string.
 */
function sameKeys(a: unknown[] | undefined, b: unknown[] | undefined): boolean {
    if (a === b) return true
    if (!a || !b || a.length !== b.length) return false
    return a.map(String).join('\u0000') === b.map(String).join('\u0000')
}

// An error boundary has to be a class: getDerivedStateFromError and componentDidCatch have no
// hook equivalent. The react-refresh rule then reports the internal ErrorScreen below, because a
// file exporting a class component plus another component breaks Fast Refresh granularity. Both
// only affect the dev server, and five other files in src/components/ui carry the same warning.
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // No error reporting backend is configured, so the console is the only sink. This is
        // what a support request can point at.
        console.error('Relay render error:', error, info.componentStack)
    }

    reset = () => {
        this.setState({ error: null })
    }

    componentDidUpdate(prevProps: Props) {
        if (this.state.error && !sameKeys(prevProps.resetKeys, this.props.resetKeys)) {
            this.reset()
        }
    }

    render() {
        const { error } = this.state
        if (!error) return this.props.children

        if (this.props.fallback) return this.props.fallback(error, this.reset)

        return <ErrorScreen error={error} onRetry={this.reset} />
    }
}

function ErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
    const t = useLanguageStore(s => s.t)
    const staleChunk = isChunkLoadError(error)

    // Say it plainly. A hotel staff member who hits this at 2am needs to know whether to wait,
    // retry, or reopen the app, not read a stack trace.
    const title = staleChunk ? t('error.boundary.staleTitle') : t('error.boundary.title')
    const body = staleChunk ? t('error.boundary.staleBody') : t('error.boundary.body')

    return (
        <div
            role="alert"
            data-testid="error-boundary"
            className="min-h-dvh flex items-center justify-center bg-background px-6 py-16"
        >
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-6" aria-hidden />
                </div>

                <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
                    {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                    <Button onClick={onRetry} data-testid="error-boundary-retry">
                        <RotateCcw aria-hidden />
                        {t('error.boundary.retry')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        data-testid="error-boundary-reload"
                    >
                        <RefreshCw aria-hidden />
                        {t('error.boundary.reload')}
                    </Button>
                </div>

                {import.meta.env.DEV && (
                    <details className="mt-8 text-left">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                            {t('error.boundary.details')}
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {error.message}
                            {error.stack ? `\n\n${error.stack}` : ''}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    )
}
