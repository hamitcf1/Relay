import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Star, Globe, Shield, Smartphone, Zap, Lock, BarChart3, Clock, Users, MessageSquare, Download, Apple, Play } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useEffect, useRef, useState } from 'react'

export function LandingPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { t, language } = useLanguageStore()
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
    }, [words]) // Changed dependency from words.length to words

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])



    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Relay",
        "operatingSystem": "Web, iOS, Android",
        "applicationCategory": "BusinessApplication",
        "description": "Next-generation digital handover and operations system for hotels.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "120"
        }
    }

    return (
        <main className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 flex flex-col">
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>

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
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" aria-hidden="true" />
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
                                        className="absolute text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 whitespace-nowrap pb-2 [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                                    >
                                        {words[index]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-10">
                            {t('landing.hero.subtitle')}
                        </p>

                        <nav className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => navigate('/pricing')}
                                className="h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200 rounded-full w-full sm:w-auto transition-transform hover:scale-105 shadow-xl shadow-white/10"
                                aria-label={t('landing.hero.cta.primary')}
                            >
                                {t('landing.hero.cta.primary')}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate('/live-demo')}
                                className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 rounded-full w-full sm:w-auto backdrop-blur-sm"
                                aria-label={t('landing.hero.cta.secondary')}
                            >
                                <Play className="w-4 h-4 mr-2" aria-hidden="true" /> {t('landing.hero.cta.secondary')}
                            </Button>
                        </nav>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    aria-hidden="true"
                >
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
                        <div className="w-1 h-3 bg-white/50 rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* Get App Section */}
            <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm relative z-20 shrink-0">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-8 italic">{t('landing.getApp.title')}</h2>
                    <nav className="flex flex-wrap justify-center gap-4">
                        <AppButton icon={<Apple className="w-6 h-6" aria-hidden="true" />} label={t('landing.getApp.appStore')} sub={t('landing.getApp.appStoreSub')} />
                        <AppButton icon={<Smartphone className="w-6 h-6" aria-hidden="true" />} label={t('landing.getApp.googlePlay')} sub={t('landing.getApp.googlePlaySub')} />
                        <AppButton icon={<Download className="w-6 h-6" aria-hidden="true" />} label={t('landing.getApp.directApk')} sub={t('landing.getApp.directApkSub')} />
                        <AppButton icon={<Globe className="w-6 h-6" aria-hidden="true" />} label={t('landing.getApp.webApp')} sub={t('landing.getApp.webAppSub')} onClick={() => navigate('/login')} />
                    </nav>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-zinc-950 relative z-20 shrink-0">
                <div className="container mx-auto px-6">
                    <header className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-white mb-4">{t('landing.features.title')}</h2>
                        <p className="text-zinc-400">{t('landing.features.subtitle')}</p>
                    </header>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <FeatureCard
                            icon={<Smartphone className="w-6 h-6 text-blue-400" aria-hidden="true" />}
                            title={t('landing.feature.mobile.title')}
                            desc={t('landing.feature.mobile.desc')}
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-emerald-400" aria-hidden="true" />}
                            title={t('landing.feature.security.title')}
                            desc={t('landing.feature.security.desc')}
                        />
                        <FeatureCard
                            icon={<Globe className="w-6 h-6 text-purple-400" aria-hidden="true" />}
                            title={t('landing.feature.sync.title')}
                            desc={t('landing.feature.sync.desc')}
                        />
                        <FeatureCard
                            icon={<MessageSquare className="w-6 h-6 text-pink-400" aria-hidden="true" />}
                            title={t('landing.feature.messaging.title')}
                            desc={t('landing.feature.messaging.desc')}
                        />
                        <FeatureCard
                            icon={<Clock className="w-6 h-6 text-orange-400" aria-hidden="true" />}
                            title={t('landing.feature.handovers.title')}
                            desc={t('landing.feature.handovers.desc')}
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-cyan-400" aria-hidden="true" />}
                            title={t('landing.feature.roster.title')}
                            desc={t('landing.feature.roster.desc')}
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
                            title={t('landing.feature.analytics.title')}
                            desc={t('landing.feature.analytics.desc')}
                        />
                        <FeatureCard
                            icon={<Lock className="w-6 h-6 text-red-400" aria-hidden="true" />}
                            title={t('landing.feature.vault.title')}
                            desc={t('landing.feature.vault.desc')}
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-400" aria-hidden="true" />}
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
                        aria-label={t('landing.pricing.cta')}
                    >
                        {t('landing.pricing.cta')}
                    </Button>
                </div>
            </section>
        </main>
    )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
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
