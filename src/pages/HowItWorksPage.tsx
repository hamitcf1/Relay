import { motion } from 'framer-motion'
import {
    Laptop, Smartphone, CheckCircle2, Zap, ArrowLeft
} from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HowItWorksPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const steps = [
        { title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc'), icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
        { title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc'), icon: Laptop, color: "text-primary", bg: "bg-primary/10" },
        { title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc'), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { title: t('howItWorks.step4.title'), desc: t('howItWorks.step4.desc'), icon: Smartphone, color: "text-primary", bg: "bg-primary/10" }
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
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                            {t('howItWorks.title')}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
                            {t('howItWorks.heroH1')}
                        </h1>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            {t('howItWorks.subtitle')}
                        </p>
                    </motion.div>
                </div>

                {/* Steps */}
                <div className="max-w-3xl mx-auto">
                    <div className="relative">
                        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-zinc-800 hidden sm:block" />
                        <div className="space-y-8">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    className="flex gap-5"
                                >
                                    <div className="relative z-10 shrink-0">
                                        <div className={`w-10 h-10 rounded-lg ${step.bg} border border-zinc-800 flex items-center justify-center`}>
                                            <step.icon className={`w-4 h-4 ${step.color}`} aria-hidden="true" />
                                        </div>
                                    </div>
                                    <div className="pt-1.5 pb-2">
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                                            Step {i + 1}
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{step.title}</h3>
                                        <p className="text-zinc-400 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 max-w-2xl mx-auto p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">{t('howItWorks.cta.title')}</h2>
                    <p className="text-zinc-400 text-sm mb-5">
                        {t('howItWorks.cta.desc')}
                    </p>
                    <Button onClick={() => navigate('/register')}>
                        {t('features.cta.start')}
                    </Button>
                </div>
            </div>
        </div>
    )
}
