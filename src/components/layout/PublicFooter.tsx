import { Github, Twitter, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { RelayBrand } from '@/components/brand/RelayBrand'

export function PublicFooter() {
    const { t } = useLanguageStore()

    return (
        <footer className="mt-10 shrink-0 border-t border-border/50 bg-surface-deep/40 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

                    {/* Column 1: Brand & Socials */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 mb-4 w-fit">
                            <RelayBrand markClassName="h-7 w-7" wordmarkClassName="text-sm text-white" />
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6 pr-4">
                            {t('app.description')}
                        </p>
                        <div className="flex gap-4">
                            <a href="https://github.com/hamitcf1" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com/hamitcf" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://youtube.com/@hamitcf" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label="YouTube">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Product</h4>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/features" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.features')}</Link></li>
                            <li><Link to="/pricing" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.pricing')}</Link></li>
                            <li><Link to="/how-it-works" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.howItWorks')}</Link></li>
                            <li><Link to="/live-demo" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.demo')}</Link></li>
                            <li><Link to="/download" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.download')}</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Resources</h4>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/blog" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.blog')}</Link></li>
                            <li><Link to="/updates" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.updates')}</Link></li>
                            <li><Link to="/legal/status" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.status')}</Link></li>
                            <li><Link to="/community" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.community')}</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Legal</h4>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/legal/privacy" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.privacy')}</Link></li>
                            <li><Link to="/legal/terms" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.terms')}</Link></li>
                            <li><Link to="/contact" className="text-sm text-zinc-400 hover:text-primary transition-colors">{t('landing.footer.contact')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                        © {new Date().getFullYear()} Aetherius Relay Systems Inc. {t('landing.footer.rights')}
                    </p>
                </div>
            </div>
        </footer>
    )
}
