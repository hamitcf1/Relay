import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Globe, Menu, X, ArrowLeft } from 'lucide-react'
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
import { RelayBrand } from '@/components/brand/RelayBrand'

export function PublicNavbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { t, language, setLanguage } = useLanguageStore()

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

    return (
        <nav className="fixed left-3 right-3 top-3 z-50 mx-auto max-w-7xl rounded-[1.35rem] border-[5px] border-surface-deep bg-card/[0.86] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06),0_18px_55px_-34px_hsl(var(--foreground)/0.56)] backdrop-blur-xl">
            <div className="mx-auto flex h-[62px] items-center justify-between px-4 sm:px-6">

                {/* Brand */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <RelayBrand markClassName="h-8 w-8" wordmarkClassName="text-base text-white" />
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    <Link to="/features" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">{t('landing.nav.features')}</Link>
                    <Link to="/how-it-works" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">{t('landing.nav.howItWorks')}</Link>
                    <Link to="/pricing" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">{t('landing.nav.pricing')}</Link>
                    <Link to="/blog" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">{t('landing.nav.blog')}</Link>
                </div>

                {/* Right side */}
                <div className="hidden md:flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Select language" className="text-zinc-400 hover:text-white hover:bg-white/5 h-9 w-9">
                                <Globe className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-white/5 cursor-pointer">
                                English
                                {language === 'en' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="hover:bg-white/5 cursor-pointer">
                                Türkçe
                                {language === 'tr' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('ru')} className="hover:bg-white/5 cursor-pointer">
                                Русский
                                {language === 'ru' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {!isAuthPage && (
                        <>
                            <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                {t('landing.nav.login')}
                            </Link>
                            <Button
                                onClick={() => navigate('/pricing')}
                                size="sm"
                            className="rounded-full"
                            >
                                {t('landing.nav.getStarted')}
                            </Button>
                        </>
                    )}
                    {isAuthPage && (
                        <Button
                            onClick={() => navigate('/')}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
                            {t('auth.backToHome')}
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Select language" className="text-zinc-400 hover:text-white hover:bg-white/5 h-9 w-9">
                                <Globe className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-white/5 cursor-pointer">
                                English
                                {language === 'en' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="hover:bg-white/5 cursor-pointer">
                                Türkçe
                                {language === 'tr' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-md"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
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
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border/50 bg-card md:hidden"
                    >
                        <div className="px-6 py-4 flex flex-col gap-1">
                            <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">{t('landing.nav.features')}</Link>
                            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">{t('landing.nav.howItWorks')}</Link>
                            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">{t('landing.nav.pricing')}</Link>
                            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">{t('landing.nav.blog')}</Link>

                            <div className="h-px w-full bg-white/10 my-2" />

                            {!isAuthPage && (
                                <>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">{t('landing.nav.login')}</Link>
                                    <Button
                                        onClick={() => { setMobileMenuOpen(false); navigate('/pricing'); }}
                                        className="w-full mt-2 bg-white text-black hover:bg-zinc-200 rounded-full"
                                    >
                                        {t('landing.nav.getStarted')}
                                    </Button>
                                </>
                            )}
                            {isAuthPage && (
                                <Button
                                    onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
                                    variant="outline"
                                    className="w-full mt-2 border-white/10 text-zinc-300 hover:bg-white/5"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                                    {t('auth.backToHome')}
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
