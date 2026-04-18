import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Globe, Menu, X, ArrowLeft, ChevronDown, Layout, Sparkles, BrainCircuit } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageStore } from '@/stores/languageStore'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

export function PublicNavbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { t, language, setLanguage } = useLanguageStore()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050505]/80 border-b border-white/5 transition-all">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                
                {/* Brand / Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all group-hover:scale-105">
                        <span className="font-bold text-white text-lg">R</span>
                    </div>
                    <span className="font-black text-xl text-white tracking-tight">Aetherius Relay</span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/features" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">{t('landing.nav.features')}</Link>
                    <Link to="/how-it-works" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">{t('landing.nav.howItWorks')}</Link>
                    <Link to="/pricing" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">{t('landing.nav.pricing')}</Link>
                    <Link to="/blog" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">{t('landing.nav.blog')}</Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-sm font-semibold text-gray-400 hover:text-white flex items-center gap-2 p-0 h-auto bg-transparent hover:bg-transparent">
                                Ecosystem <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white w-56 p-2 rounded-2xl backdrop-blur-xl">
                            <DropdownMenuItem className="focus:bg-white/5 rounded-xl transition-colors cursor-pointer p-3" asChild>
                                <a href="https://hamitcf.info/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Layout className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Portfolio Hub</span>
                                        <span className="text-[10px] text-zinc-500">Main Gateway</span>
                                    </div>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/5 rounded-xl transition-colors cursor-pointer p-3" asChild>
                                <a href="https://lexify.hamitcf.info/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <BrainCircuit className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Lexify</span>
                                        <span className="text-[10px] text-zinc-500">Language Learning</span>
                                    </div>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/5 rounded-xl transition-colors cursor-pointer p-3" asChild>
                                <a href="https://skyaetherius.hamitcf.info/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Skyrim Aetherius</span>
                                        <span className="text-[10px] text-zinc-500">RPG Suite</span>
                                    </div>
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>


                    <div className="h-4 w-[1px] bg-white/10"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5 focus-visible:ring-0">
                                <Globe className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/10 text-white z-[100]">
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
                            <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                                {t('landing.nav.login')}
                            </Link>
                            <button
                                onClick={() => navigate('/pricing')}
                                className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full transition-all hover:scale-105 hover:bg-gray-100 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                            >
                                {t('landing.nav.getStarted')}
                            </button>
                        </>
                    )}
                    {(location.pathname === '/login' || location.pathname === '/register') && (
                        <button onClick={() => navigate('/')} className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            {t('auth.backToHome')}
                        </button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5">
                                <Globe className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/10 text-white z-[100]">
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
                    <button 
                        className="p-2 -mr-2 text-gray-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="px-6 py-6 flex flex-col gap-4">
                            <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t('landing.nav.features')}</Link>
                            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t('landing.nav.howItWorks')}</Link>
                            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t('landing.nav.pricing')}</Link>
                            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t('landing.nav.blog')}</Link>
                            
                            <div className="h-[1px] w-full bg-white/10 my-2"></div>
                            
                            {location.pathname !== '/login' && location.pathname !== '/register' && (
                                <>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t('landing.nav.login')}</Link>
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); navigate('/pricing'); }}
                                        className="w-full mt-2 text-center text-lg font-bold bg-white text-black px-6 py-3 rounded-xl shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                                    >
                                        {t('landing.nav.getStarted')}
                                    </button>
                                </>
                            )}
                            {(location.pathname === '/login' || location.pathname === '/register') && (
                                <button onClick={() => { setMobileMenuOpen(false); navigate('/'); }} className="w-full mt-2 flex items-center justify-center gap-2 text-lg font-medium text-gray-300 hover:text-white py-3 border border-white/10 rounded-xl">
                                    <ArrowLeft className="w-5 h-5" />
                                    {t('auth.backToHome')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
