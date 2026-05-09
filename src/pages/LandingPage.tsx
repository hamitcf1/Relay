import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Globe, Shield, Smartphone, Zap, Lock, BarChart3, Clock, Users, MessageSquare, Play } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useEffect } from 'react'

const STAGGER_CONTAINER = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
}

const STRUCTURED_DATA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Aetherius Relay",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "BusinessApplication",
    "description": "Digital handover and operations system for hotels.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}

export function LandingPage() {
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)
    const t = useLanguageStore(s => s.t)

    useEffect(() => {
        if (user) navigate('/dashboard')
    }, [user, navigate])

    return (
        <main className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 flex flex-col relative">
            <script type="application/ld+json">
                {JSON.stringify(STRUCTURED_DATA)}
            </script>

            {/* Hero Section */}
            <section className="min-h-[80vh] py-32 relative flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[80px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative z-10 text-center px-4 max-w-5xl mx-auto"
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.05]">
                        {t('landing.hero.title.prefix')}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                            {t('landing.hero.title.suffix')}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        {t('landing.hero.subtitle')}
                    </p>

                    <nav className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            size="lg"
                            onClick={() => navigate('/pricing')}
                            className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-full w-full sm:w-auto active:scale-[0.98] transition-transform"
                        >
                            {t('landing.hero.cta.primary')}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => navigate('/live-demo')}
                            className="h-12 px-6 border-white/20 text-white hover:bg-white/10 rounded-full w-full sm:w-auto active:scale-[0.98] transition-transform"
                        >
                            <Play className="w-4 h-4 mr-2" aria-hidden="true" /> {t('landing.hero.cta.secondary')}
                        </Button>
                    </nav>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-zinc-950 shrink-0">
                <div className="container mx-auto px-6">
                    <header className="text-center mb-12 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">{t('landing.features.title')}</h2>
                        <p className="text-zinc-400">{t('landing.features.subtitle')}</p>
                    </header>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={STAGGER_CONTAINER}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
                    >
                        <FeatureCard
                            icon={<Smartphone className="w-5 h-5 text-blue-400" aria-hidden="true" />}
                            title={t('landing.feature.mobile.title')}
                            desc={t('landing.feature.mobile.desc')}
                        />
                        <FeatureCard
                            icon={<Shield className="w-5 h-5 text-emerald-400" aria-hidden="true" />}
                            title={t('landing.feature.security.title')}
                            desc={t('landing.feature.security.desc')}
                        />
                        <FeatureCard
                            icon={<Globe className="w-5 h-5 text-purple-400" aria-hidden="true" />}
                            title={t('landing.feature.sync.title')}
                            desc={t('landing.feature.sync.desc')}
                        />
                        <FeatureCard
                            icon={<MessageSquare className="w-5 h-5 text-pink-400" aria-hidden="true" />}
                            title={t('landing.feature.messaging.title')}
                            desc={t('landing.feature.messaging.desc')}
                        />
                        <FeatureCard
                            icon={<Clock className="w-5 h-5 text-orange-400" aria-hidden="true" />}
                            title={t('landing.feature.handovers.title')}
                            desc={t('landing.feature.handovers.desc')}
                        />
                        <FeatureCard
                            icon={<Users className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
                            title={t('landing.feature.roster.title')}
                            desc={t('landing.feature.roster.desc')}
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
                            title={t('landing.feature.analytics.title')}
                            desc={t('landing.feature.analytics.desc')}
                        />
                        <FeatureCard
                            icon={<Lock className="w-5 h-5 text-red-400" aria-hidden="true" />}
                            title={t('landing.feature.vault.title')}
                            desc={t('landing.feature.vault.desc')}
                        />
                        <FeatureCard
                            icon={<Zap className="w-5 h-5 text-yellow-400" aria-hidden="true" />}
                            title={t('landing.feature.tasks.title')}
                            desc={t('landing.feature.tasks.desc')}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-24 bg-black relative z-20 shrink-0">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">{t('landing.pricing.title')}</h2>
                    <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
                        {t('landing.pricing.subtitle')}
                    </p>
                    <Button
                        onClick={() => navigate('/pricing')}
                        size="lg"
                        className="bg-white text-black hover:bg-zinc-200 rounded-full active:scale-[0.98]"
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
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 }
            }}
            className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
            <div className="mb-4 p-2.5 rounded-lg bg-zinc-900 w-fit border border-zinc-800">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
        </motion.div>
    )
}

