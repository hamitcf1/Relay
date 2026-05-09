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
