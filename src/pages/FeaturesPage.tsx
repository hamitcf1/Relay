import { motion } from 'framer-motion'
import { Users, BarChart3, MessageCircle, Clock, Zap, Globe, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function FeaturesPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const features = [
        {
            title: t('features.handovers.title'),
            desc: t('features.handovers.desc'),
            icon: <Clock className="w-6 h-6 text-blue-400" />
        },
        {
            title: t('features.roster.title'),
            desc: t('features.roster.desc'),
            icon: <Users className="w-6 h-6 text-emerald-400" />
        },
        {
            title: t('features.ai.title'),
            desc: t('features.ai.desc'),
            icon: <Zap className="w-6 h-6 text-yellow-400" />
        },
        {
            title: t('features.analytics.title'),
            desc: t('features.analytics.desc'),
            icon: <BarChart3 className="w-6 h-6 text-indigo-400" />
        },
        {
            title: t('features.messaging.title'),
            desc: t('features.messaging.desc'),
            icon: <MessageCircle className="w-6 h-6 text-pink-400" />
        },
        {
            title: t('features.cloud.title'),
            desc: t('features.cloud.desc'),
            icon: <Globe className="w-6 h-6 text-cyan-400" />
        }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
            {/* Navigation Backlink */}
            <div className="container mx-auto px-6 pt-32">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white group transition-colors"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('common.backToHome')}
                </Button>
            </div>

            <div className="container mx-auto px-6 py-20">
                <div className="text-center mb-20 pt-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                    >
                        {t('features.title')}
                    </motion.h1>
                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                        {t('features.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                {f.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                            <p className="text-zinc-400 leading-relaxed">{f.desc}</p>

                            {/* Accent Glow */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
