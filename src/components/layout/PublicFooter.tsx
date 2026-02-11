import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

export function PublicFooter() {
    const { t } = useLanguageStore()

    return (
        <footer className="py-12 bg-zinc-950 border-t border-white/5 relative z-20 h-auto sm:h-auto overflow-visible w-full">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                            <span className="font-bold text-white text-xs">R</span>
                        </div>
                        <span className="font-bold text-white">Relay</span>
                    </div>
                    <p className="text-sm text-zinc-500">© 2026 Relay Systems Inc.</p>
                </div>

                <div className="flex gap-6">
                    <Link to="/legal/privacy" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.privacy')}</Link>
                    <Link to="/legal/terms" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.terms')}</Link>
                    <Link to="/legal/status" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.status')}</Link>
                </div>

                <a
                    href="mailto:hamitfindik2@gmail.com"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10 text-zinc-300"
                >
                    <Mail className="w-4 h-4" />
                    <span>{t('landing.footer.contact')}</span>
                </a>
            </div>
        </footer>
    )
}
