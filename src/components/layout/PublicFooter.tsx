import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

export function PublicFooter() {
    const { t } = useLanguageStore()

    return (
        <footer className="py-12 bg-zinc-950 border-t border-white/5 relative z-20 h-auto sm:h-auto overflow-visible w-full">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-white">R</span>
                        </div>
                        <span className="font-bold text-white text-xl">Relay</span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">{t('app.description')}</p>
                    <p className="text-xs text-zinc-600">© 2026 Relay Systems Inc. {t('landing.footer.rights')}</p>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('landing.footer.product')}</h4>
                    <ul className="space-y-2">
                        <li><Link to="/features" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.features')}</Link></li>
                        <li><Link to="/pricing" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.pricing')}</Link></li>
                        <li><Link to="/how-it-works" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.howItWorks')}</Link></li>
                        <li><Link to="/live-demo" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.demo')}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('landing.footer.info')}</h4>
                    <ul className="space-y-2">
                        <li><Link to="/blog" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.blog')}</Link></li>
                        <li><Link to="/updates" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.updates')}</Link></li>
                        <li><Link to="/legal/status" className="text-zinc-500 hover:text-white transition-colors text-sm">{t('landing.footer.status')}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('landing.footer.support')}</h4>
                    <div className="space-y-4">
                        <a
                            href="mailto:hamitfindik2@gmail.com"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors border border-white/10 text-zinc-300 w-fit"
                        >
                            <Mail className="w-4 h-4" />
                            <span>{t('landing.footer.contact')}</span>
                        </a>
                        <div className="flex gap-4">
                            <Link to="/legal/privacy" className="text-zinc-500 hover:text-white transition-colors text-xs">{t('landing.footer.privacy')}</Link>
                            <Link to="/legal/terms" className="text-zinc-500 hover:text-white transition-colors text-xs">{t('landing.footer.terms')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
