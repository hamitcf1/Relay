
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Globe, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

export function PublicNavbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t, language, setLanguage } = useLanguageStore()

    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr')
    }

    const isLandingPage = location.pathname === '/'

    const scrollToFeatures = () => {
        if (isLandingPage) {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
        } else {
            navigate('/?features=true')
        }
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-black/30">
            <Link to="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">Relay</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <button onClick={scrollToFeatures} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.features')}
                </button>
                <Link to="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {t('landing.nav.pricing')}
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-zinc-400 hover:text-white hover:bg-white/5">
                    <Globe className="w-5 h-5" />
                </Button>

                {location.pathname !== '/login' && location.pathname !== '/register' && (
                    <>
                        <Button variant="ghost" onClick={() => navigate('/login')} className="text-zinc-400 hover:text-white hover:bg-white/5 hidden sm:flex">
                            {t('landing.nav.login')}
                        </Button>
                        <Button onClick={() => navigate('/pricing')} className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105">
                            {t('landing.nav.getStarted')}
                        </Button>
                    </>
                )}
                {(location.pathname === '/login' || location.pathname === '/register') && (
                    <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-400 hover:text-white hover:bg-white/5 hidden sm:flex gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t('auth.backToHome')}
                    </Button>
                )}
            </div>
        </nav>
    )
}
