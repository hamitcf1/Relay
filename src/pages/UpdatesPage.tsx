import { motion } from 'framer-motion'
import { Zap, ArrowLeft, ChevronRight } from 'lucide-react'
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
            type: 'feature',
            icon: <Zap className="w-5 h-5 text-yellow-400" />
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
                        {t('updates.title')}
                    </motion.h1>
                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                        {t('updates.subtitle')}
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="relative pl-12 border-l border-white/5 space-y-20">
                        {updates.map((update, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative"
                            >
                                {/* Timeline Dot */}
                                <div className="absolute -left-[3.75rem] top-0 w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center -translate-x-0.5 z-10">
                                    {update.icon}
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/10 transition-all group">
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <span className="px-4 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black tracking-widest uppercase border border-indigo-500/20">
                                            {update.version}
                                        </span>
                                        <span className="text-zinc-500 text-xs font-medium">
                                            {update.date}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-indigo-400 transition-colors">
                                        {update.title}
                                    </h3>
                                    <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                        {update.desc}
                                    </p>
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-[10px]">
                                        {t('updates.changelog')} <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
