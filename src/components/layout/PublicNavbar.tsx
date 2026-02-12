
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Globe, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PublicNavbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t, language, setLanguage } = useLanguageStore()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-black/30">
            <Link to="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors hidden sm:inline">Relay</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <Link to="/features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.features')}
                </Link>
                <Link to="/how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.howItWorks')}
                </Link>
                <Link to="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.pricing')}
                </Link>
                <Link to="/blog" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.blog')}
                </Link>
                <Link to="/updates" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.updates')}
                </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5">
                            <Globe className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/10 text-white">
                        <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-white/10 cursor-pointer">
                            English
                            {language === 'en' && <span className="ml-2 text-primary">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('tr')} className="hover:bg-white/10 cursor-pointer">
                            Türkçe
                            {language === 'tr' && <span className="ml-2 text-primary">✓</span>}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {location.pathname !== '/login' && location.pathname !== '/register' && (
                    <>
                        <Button variant="ghost" onClick={() => navigate('/login')} className="text-zinc-400 hover:text-white hover:bg-white/5">
                            {t('landing.nav.login')}
                        </Button>
                        <Button onClick={() => navigate('/pricing')} className="bg-white text-black hover:bg-zinc-200 rounded-full px-4 sm:px-6 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105">
                            {t('landing.nav.getStarted')}
                        </Button>
                    </>
                )}
                {(location.pathname === '/login' || location.pathname === '/register') && (
                    <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-400 hover:text-white hover:bg-white/5 flex gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('auth.backToHome')}</span>
                    </Button>
                )}
            </div>
        </nav>
    )
}
