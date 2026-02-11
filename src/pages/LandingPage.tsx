import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Star, Globe, Shield, Smartphone, Mail, Zap, Lock, BarChart3, Clock, Users, MessageSquare, Download, Apple, Play } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useEffect, useRef, useState } from 'react'
import { CustomCursor } from '@/components/ui/CustomCursor'

export function LandingPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { t, language, setLanguage } = useLanguageStore()
    const targetRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    })

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

    // Cycling words for "Next-Gen [Word]"
    const words = language === 'tr'
        ? ['Konaklama', 'Operasyon', 'Yönetim', 'Deneyim']
        : ['Hospitality', 'Operations', 'Management', 'Experience']

    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [words.length])

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr')
    }

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none flex flex-col">
            <CustomCursor />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-black/30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white">R</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Relay</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
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
                    <Button variant="ghost" onClick={() => navigate('/login')} className="text-zinc-400 hover:text-white hover:bg-white/5 hidden sm:flex">
                        {t('landing.nav.login')}
                    </Button>

                    <Button onClick={() => navigate('/pricing')} className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105">
                        {t('landing.nav.getStarted')}
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section ref={targetRef} className="h-screen relative flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </div>

                <motion.div
                    style={{ opacity, scale }}
                    className="relative z-10 text-center px-4 max-w-5xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm shadow-xl">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{t('landing.hero.trusted')}</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6 flex flex-col items-center justify-center gap-2">
                            <span>{t('landing.hero.title.prefix')}</span>
                            {/* Fixed width container to prevent cutout/jump */}
                            <div className="h-[1.2em] relative overflow-hidden flex justify-center w-full min-w-[300px]">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={words[index]}
                                        initial={{ y: 50, opacity: 0, rotateX: -90 }}
                                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                                        exit={{ y: -50, opacity: 0, rotateX: 90 }}
                                        transition={{ duration: 0.5, ease: "backOut" }}
                                        className="absolute text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 whitespace-nowrap pb-2"
                                    >
                                        {words[index]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-10">
                            {t('landing.hero.subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => navigate('/pricing')}
                                className="h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200 rounded-full w-full sm:w-auto transition-transform hover:scale-105 shadow-xl shadow-white/10"
                            >
                                {t('landing.hero.cta.primary')}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate('/live-demo')}
                                className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 rounded-full w-full sm:w-auto backdrop-blur-sm"
                            >
                                <Play className="w-4 h-4 mr-2" /> {t('landing.hero.cta.secondary')}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
                        <div className="w-1 h-3 bg-white/50 rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* Get App Section */}
            <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm relative z-20 shrink-0">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-8">{t('landing.getApp.title')}</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        <AppButton icon={<Apple className="w-6 h-6" />} label="App Store" sub="Download for iOS" />
                        <AppButton icon={<Smartphone className="w-6 h-6" />} label="Google Play" sub="Get it on Android" />
                        <AppButton icon={<Download className="w-6 h-6" />} label="Direct APK" sub="Android Package" />
                        <AppButton icon={<Globe className="w-6 h-6" />} label="Web App" sub="Access in Browser" onClick={() => navigate('/login')} />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-zinc-950 relative z-20 shrink-0">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-white mb-4">{t('landing.features.title')}</h2>
                        <p className="text-zinc-400">{t('landing.features.subtitle')}</p>
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <FeatureCard
                            icon={<Smartphone className="w-6 h-6 text-blue-400" />}
                            title={t('landing.feature.mobile.title')}
                            desc={t('landing.feature.mobile.desc')}
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-emerald-400" />}
                            title={t('landing.feature.security.title')}
                            desc={t('landing.feature.security.desc')}
                        />
                        <FeatureCard
                            icon={<Globe className="w-6 h-6 text-purple-400" />}
                            title={t('landing.feature.sync.title')}
                            desc={t('landing.feature.sync.desc')}
                        />
                        <FeatureCard
                            icon={<MessageSquare className="w-6 h-6 text-pink-400" />}
                            title={t('landing.feature.messaging.title')}
                            desc={t('landing.feature.messaging.desc')}
                        />
                        <FeatureCard
                            icon={<Clock className="w-6 h-6 text-orange-400" />}
                            title={t('landing.feature.handovers.title')}
                            desc={t('landing.feature.handovers.desc')}
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-cyan-400" />}
                            title={t('landing.feature.roster.title')}
                            desc={t('landing.feature.roster.desc')}
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-indigo-400" />}
                            title={t('landing.feature.analytics.title')}
                            desc={t('landing.feature.analytics.desc')}
                        />
                        <FeatureCard
                            icon={<Lock className="w-6 h-6 text-red-400" />}
                            title={t('landing.feature.vault.title')}
                            desc={t('landing.feature.vault.desc')}
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-400" />}
                            title={t('landing.feature.tasks.title')}
                            desc={t('landing.feature.tasks.desc')}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-32 bg-black relative z-20 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6">{t('landing.pricing.title')}</h2>
                    <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                        {t('landing.pricing.subtitle')}
                    </p>
                    <Button
                        onClick={() => navigate('/pricing')}
                        className="h-16 px-10 text-xl bg-white text-black hover:bg-zinc-200 rounded-full transition-transform hover:scale-105"
                    >
                        {t('landing.pricing.cta')}
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-zinc-950 border-t border-white/5 relative z-20 h-auto sm:h-auto overflow-visible">
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
        </div>
    )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-none"
        >
            <div className="mb-6 p-4 rounded-2xl bg-black/50 w-fit group-hover:scale-110 transition-transform duration-500 border border-white/5">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
        </motion.div>
    )
}

function AppButton({ icon, label, sub, onClick }: { icon: React.ReactNode, label: string, sub: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-black/50 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group text-left min-w-[200px]"
        >
            <div className="text-zinc-400 group-hover:text-white transition-colors">
                {icon}
            </div>
            <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider leading-none mb-1">{sub}</div>
                <div className="font-bold text-white leading-none">{label}</div>
            </div>
        </button>
    )
}
