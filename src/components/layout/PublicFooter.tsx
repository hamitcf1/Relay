import { Github, Twitter, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'

export function PublicFooter() {
    const { t } = useLanguageStore()

    return (
        <footer className="py-16 border-t border-white/5 bg-[#050505] relative z-10 shrink-0">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    
                    {/* Column 1: Brand & Socials */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4 group w-fit">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-primary/20">
                                <span className="font-bold text-white text-sm">R</span>
                            </div>
                            <span className="font-bold text-white">Aetherius Relay</span>
                        </Link>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6 pr-4">
                            {t('app.description')}
                        </p>
                        <div className="flex gap-4">
                            <a href="https://github.com/hamitcf1" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com/hamitcf" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://youtube.com/@hamitcf" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="YouTube">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-6">Product</h4>
                        <ul className="flex flex-col gap-4">
                            <li><Link to="/features" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.features')}</Link></li>
                            <li><Link to="/pricing" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.pricing')}</Link></li>
                            <li><Link to="/how-it-works" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.howItWorks')}</Link></li>
                            <li><Link to="/live-demo" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.demo')}</Link></li>
                            <li><Link to="/download" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.download')}</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-6">Resources</h4>
                        <ul className="flex flex-col gap-4">
                            <li><Link to="/blog" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.blog')}</Link></li>
                            <li><Link to="/updates" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.updates')}</Link></li>
                            <li><Link to="/legal/status" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.status')}</Link></li>
                            <li><Link to="/community" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.community')}</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-6">Legal</h4>
                        <ul className="flex flex-col gap-4">
                            <li><Link to="/legal/privacy" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.privacy')}</Link></li>
                            <li><Link to="/legal/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.terms')}</Link></li>
                            <li><Link to="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">{t('landing.footer.contact')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} Aetherius Relay Systems Inc. {t('landing.footer.rights')}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        Crafted by <span className="text-primary font-medium">Hamit Can Fındık</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
