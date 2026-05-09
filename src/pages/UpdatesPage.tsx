import { motion } from 'framer-motion'
import { Zap, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function UpdatesPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const updates = [
        {
            version: t('updates.v1.version'),
            date: t('updates.v1.date'),
            title: t('updates.v1.title'),
            desc: t('updates.v1.desc'),
            icon: Zap,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10"
        }
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
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        {t('updates.title')}
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        {t('updates.subtitle')}
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="space-y-4">
                        {updates.map((update, i) => {
                            const Icon = update.icon
                            return (
                                <motion.article
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-9 h-9 rounded-lg ${update.bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-4 h-4 ${update.color}`} aria-hidden="true" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                                                {update.version}
                                            </span>
                                            <span className="text-zinc-500 text-xs">
                                                {update.date}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
                                        {update.title}
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        {update.desc}
                                    </p>
                                </motion.article>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
