import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { initLanguage } from './stores/languageStore'

// A deploy replaces the hashed filenames in dist/assets, so a tab left open from a previous
// deploy asks for a file that no longer exists. Vite fires this event when the preload of the
// first chunk fails. Reloading is the only fix, but an unconditional reload loops forever when
// the chunk is genuinely gone, which is worse than the original problem: the guard lets exactly
// one reload through, then stops and leaves a blank page for the ErrorBoundary to explain.
let reloadedForStaleChunk = false
window.addEventListener('vite:preloadError', () => {
    if (reloadedForStaleChunk) return
    reloadedForStaleChunk = true
    window.location.reload()
})

initLanguage().finally(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            {/* Last resort. The boundary inside App.tsx covers the routes; this one catches a
                throw from the providers above the router, where the router fallback cannot help. */}
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </StrictMode>,
    )
})

// Dev only. Dynamic on purpose: the stores and authStore import each other in places, so this
// has to load after the app has finished evaluating, never at module scope.
if (import.meta.env.DEV) {
    import('./stores/devTestHooks')
        .then(({ installStoreTestHooks }) => installStoreTestHooks())
        .catch(() => { /* test surface is optional */ })
}
