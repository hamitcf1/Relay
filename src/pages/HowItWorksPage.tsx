import { motion } from 'framer-motion'
import { 
    Laptop, Smartphone, CheckCircle2, Zap, ArrowLeft, 
    MousePointer2, Layers, Repeat, ShieldCheck 
} from 'lucide-react'
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
            icon: Zap,
            color: "text-amber-400",
            bg: "bg-amber-400/10"
        },
        {
            title: t('howItWorks.step2.title'),
            desc: t('howItWorks.step2.desc'),
            icon: Laptop,
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            title: t('howItWorks.step3.title'),
            desc: t('howItWorks.step3.desc'),
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
        },
        {
            title: t('howItWorks.step4.title'),
            desc: t('howItWorks.step4.desc'),
            icon: Smartphone,
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 relative overflow-hidden">
             {/* Ambient Background */}
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] -z-10 rounded-full" />
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 blur-[120px] -z-10 rounded-full" />

            {/* Navigation Backlink */}
            <div className="container mx-auto px-6 pt-32 mb-12 relative z-20">
                <Button
                    variant="ghost"
                    className="text-zinc-500 hover:text-white group transition-colors px-0 hover:bg-transparent"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('common.backToHome')}
                </Button>
            </div>

            <div className="container mx-auto px-6 pb-32 relative z-10">
                
                {/* Header */}
                <div className="max-w-4xl mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-6 flex items-center gap-3">
                             <Repeat className="w-5 h-5" /> Operation Workflow
                        </h2>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-10 leading-[0.85]">
                            Seamless <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400">Implementation</span>.
                        </h1>
                        <p className="text-2xl text-zinc-400 leading-relaxed max-w-2xl font-medium">
                            {t('howItWorks.subtitle')}
                        </p>
                    </motion.div>
                </div>

                {/* Steps Section */}
                <div className="max-w-5xl mx-auto">
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="absolute left-[39px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-blue-500 via-indigo-500/20 to-transparent hidden md:block" />

                        <div className="space-y-24">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col md:flex-row gap-12 group"
                                >
                                    {/* Circle Icon */}
                                    <div className="relative z-10 shrink-0">
                                        <div className={`w-20 h-20 rounded-[2rem] ${step.bg} border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-2xl shadow-black`}>
                                            <step.icon className={`w-8 h-8 ${step.color}`} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="pt-2">
                                        <div className="flex items-center gap-4 mb-4">
                                             <span className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Step 0{i+1}</span>
                                             <div className="h-px w-12 bg-zinc-800" />
                                        </div>
                                        <h3 className="text-4xl font-black text-white mb-6 tracking-tight group-hover:text-blue-400 transition-colors">{step.title}</h3>
                                        <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl font-medium">
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Automation Spotlight */}
                <div className="mt-48 flex flex-col md:flex-row items-center gap-20 p-12 md:p-24 rounded-[4rem] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5">
                    <div className="flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8">
                             <Layers className="w-7 h-7 text-indigo-400" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter italic">Automation by design.</h2>
                        <p className="text-zinc-500 text-lg leading-relaxed mb-10">
                            Relay doesn't just store data; it processes it. Every log entry is cross-referenced with your staff roster and guest history to provide context before you even ask.
                        </p>
                        <div className="flex items-center gap-4 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                             <ShieldCheck className="w-4 h-4" /> verified operational standard
                        </div>
                    </div>
                    <div className="flex-1 aspect-video rounded-[3rem] bg-zinc-900 border border-white/5 p-8 flex flex-col justify-center gap-4 overflow-hidden relative">
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                                className="h-full bg-indigo-500"
                                initial={{ width: "0%" }}
                                whileInView={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                             />
                         </div>
                         <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                         <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                         <MousePointer2 className="absolute bottom-10 right-20 w-8 h-8 text-white opacity-20" />
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-40 text-center">
                    <h3 className="text-3xl font-black text-white mb-10 tracking-tight">Zero configuration. One ecosystem.</h3>
                    <Button
                        size="lg"
                        className="bg-indigo-600 text-white font-black hover:bg-indigo-500 px-12 h-16 rounded-2xl text-lg transition-all"
                        onClick={() => navigate('/register')}
                    >
                        Initialize Your Hotel
                    </Button>
                </div>

            </div>
        </div>
    )
}
