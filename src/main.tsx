import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initLanguage } from './stores/languageStore'

window.addEventListener('vite:preloadError', () => {
    window.location.reload()
})

initLanguage().finally(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App />
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
