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
        {
            title: t('features.handovers.title'),
            desc: t('features.handovers.desc'),
            icon: Clock,
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            title: t('features.roster.title'),
            desc: t('features.roster.desc'),
            icon: Users,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
        },
        {
            title: t('features.ai.title'),
            desc: t('features.ai.desc'),
            icon: Zap,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10"
        },
        {
            title: t('features.analytics.title'),
            desc: t('features.analytics.desc'),
            icon: BarChart3,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10"
        },
        {
            title: t('features.messaging.title'),
            desc: t('features.messaging.desc'),
            icon: MessageCircle,
            color: "text-rose-400",
            bg: "bg-rose-400/10"
        },
        {
            title: t('features.cloud.title'),
            desc: t('features.cloud.desc'),
            icon: Globe,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10"
        }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] -z-10 rounded-full" />

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
                
                {/* Hero Header */}
                <div className="max-w-4xl mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                         <h2 className="text-indigo-400 font-bold tracking-widest uppercase text-sm mb-6 flex items-center gap-3">
                             <Cpu className="w-5 h-5" /> {t('features.title')}
                        </h2>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-10 leading-[0.85]">
                            Full Spectrum <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-400 to-rose-400">Hotel Logistics</span>.
                        </h1>
                        <p className="text-2xl text-zinc-400 leading-relaxed max-w-2xl font-medium">
                            {t('features.subtitle')}
                        </p>
                    </motion.div>
                </div>

                {/* Primary Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-40">
                    {mainFeatures.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="p-12 rounded-[3.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all group relative overflow-hidden"
                        >
                            <div className={`w-16 h-16 rounded-2xl ${f.bg} flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                                <f.icon className={`w-8 h-8 ${f.color}`} />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-6 tracking-tight leading-tight">{f.title}</h3>
                            <p className="text-zinc-400 text-lg leading-relaxed font-medium">{f.desc}</p>

                            {/* Decorative ID */}
                            <div className="absolute top-8 right-12 text-zinc-800 font-black text-4xl select-none group-hover:text-indigo-500/10 transition-colors">
                                0{i + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Technical Pillars Section */}
                <div className="mt-40 pt-40 border-t border-white/5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-4xl font-black text-white mb-8 tracking-tighter">Enterprise Infrastructure</h2>
                            <p className="text-zinc-400 text-xl leading-relaxed mb-12">
                                Relay is built on a distributed cloud architecture with zero single points of failure. Your hotel operations stay online even during global outages.
                            </p>
                            <div className="space-y-6">
                                {[
                                    { icon: ShieldCheck, title: "Vault Security", desc: "Military-grade encryption for all guest data and sensitive logs." },
                                    { icon: Database, title: "Real-time Sync", desc: "Proprietary sync engine ensures sub-50ms latency between departments." },
                                    { icon: Cpu, title: "AI Core", desc: "Integrated LLM processing for automated speech-to-log and summarization." }
                                ].map((item, j) => (
                                    <div key={j} className="flex gap-6 items-start">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                            <item.icon className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                                            <p className="text-zinc-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="aspect-square bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-[4rem] border border-white/5 flex items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl group-hover:opacity-0 transition-opacity" />
                            <div className="relative z-10 w-full p-20">
                                <div className="space-y-4">
                                     <div className="h-4 w-1/2 bg-indigo-500/20 rounded-full" />
                                     <div className="h-4 w-full bg-white/5 rounded-full" />
                                     <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                                     <div className="pt-8 grid grid-cols-2 gap-4">
                                         <div className="h-24 bg-purple-500/20 rounded-3xl" />
                                         <div className="h-24 bg-rose-500/20 rounded-3xl" />
                                     </div>
                                </div>
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute top-20 left-20 w-4 h-4 rounded-full bg-indigo-500 animate-ping" />
                        </motion.div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-40 p-20 rounded-[4rem] bg-indigo-600 text-center relative overflow-hidden group">
                     {/* Background animation simulation */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter relative z-10">
                        Ready to digitize your <br className="hidden md:block" /> front desk?
                    </h2>
                    <div className="flex flex-wrap justify-center gap-6 relative z-10">
                        <Button
                            size="lg"
                            className="bg-white text-indigo-600 font-black hover:bg-zinc-100 px-10 h-16 rounded-2xl text-lg transition-all"
                            onClick={() => navigate('/register')}
                        >
                            Get Started Free
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-white/20 text-white font-black hover:bg-white/10 px-10 h-16 rounded-2xl text-lg transition-all"
                            onClick={() => navigate('/live-demo')}
                        >
                            View Live Demo
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
