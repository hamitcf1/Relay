import { motion } from 'framer-motion'
import {
    Users, BarChart3, MessageCircle, Clock, Zap,
    Globe, ArrowLeft, ShieldCheck, Cpu, Database
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function FeaturesPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const mainFeatures = [
        { title: t('features.handovers.title'), desc: t('features.handovers.desc'), icon: Clock, color: "text-primary", bg: "bg-primary/10" },
        { title: t('features.roster.title'), desc: t('features.roster.desc'), icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { title: t('features.ai.title'), desc: t('features.ai.desc'), icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        { title: t('features.analytics.title'), desc: t('features.analytics.desc'), icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
        { title: t('features.messaging.title'), desc: t('features.messaging.desc'), icon: MessageCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
        { title: t('features.cloud.title'), desc: t('features.cloud.desc'), icon: Globe, color: "text-cyan-400", bg: "bg-cyan-400/10" }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">
            <div className="container mx-auto px-6 pt-12 mb-8">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white px-0 hover:bg-transparent"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('common.backToHome')}
                </Button>
            </div>

            <div className="container mx-auto px-6 pb-24">
                {/* Hero Header */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                            {t('features.title')}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
                            {t('features.heroH1')}
                        </h1>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            {t('features.subtitle')}
                        </p>
                    </motion.div>
                </div>

                {/* Primary Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto mb-24">
                    {mainFeatures.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                                <f.icon className={`w-4 h-4 ${f.color}`} aria-hidden="true" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Technical Pillars */}
                <div className="max-w-4xl mx-auto pt-16 border-t border-zinc-800">
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-3 text-center">{t('features.pillars.title')}</h2>
                    <p className="text-zinc-400 text-center mb-10 max-w-xl mx-auto">
                        {t('features.pillars.desc')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: ShieldCheck, title: t('features.pillars.vault.title'), desc: t('features.pillars.vault.desc') },
                            { icon: Database, title: t('features.pillars.sync.title'), desc: t('features.pillars.sync.desc') },
                            { icon: Cpu, title: t('features.pillars.ai.title'), desc: t('features.pillars.ai.desc') }
                        ].map((item, j) => (
                            <div key={j} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <item.icon className="w-4 h-4 text-primary" aria-hidden="true" />
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1.5">{item.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                        {t('features.cta.title')}
                    </h2>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                        {t('features.cta.desc')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button onClick={() => navigate('/register')}>
                            {t('features.cta.start')}
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/live-demo')} className="border-zinc-700 text-white hover:bg-zinc-800">
                            {t('features.cta.demo')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
