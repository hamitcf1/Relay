import { motion } from 'framer-motion'
import { Laptop, Smartphone, CheckCircle2, Zap, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HowItWorksPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const steps = [
        {
            title: t('howItWorks.step1.title'),
            desc: t('howItWorks.step1.desc'),
            icon: <Zap className="w-6 h-6 text-yellow-400" />
        },
        {
            title: t('howItWorks.step2.title'),
            desc: t('howItWorks.step2.desc'),
            icon: <Laptop className="w-6 h-6 text-blue-400" />
        },
        {
            title: t('howItWorks.step3.title'),
            desc: t('howItWorks.step3.desc'),
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        },
        {
            title: t('howItWorks.step4.title'),
            desc: t('howItWorks.step4.desc'),
            icon: <Smartphone className="w-6 h-6 text-purple-400" />
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
                        {t('howItWorks.title')}
                    </motion.h1>
                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                        {t('howItWorks.subtitle')}
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-12">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col md:flex-row items-center gap-10 bg-white/5 p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-black border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                                {step.icon}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-4">
                                    <span className="text-indigo-500 mr-2 opacity-50">0{i + 1}.</span> {step.title}
                                </h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
