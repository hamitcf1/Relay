import { motion } from 'framer-motion'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Check, Star, Zap, Shield, ArrowLeft, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function PricingPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

    const plans = [
        {
            id: 'lite',
            name: t('pricing.plan.lite'),
            desc: t('pricing.plan.lite.desc'),
            price: billingCycle === 'monthly' ? '€0' : '€0',
            features: [
                t('pricing.feature.shiftLogs'),
                t('pricing.feature.basicLogs'),
                t('pricing.feature.support')
            ],
            icon: Zap,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            buttonText: t('pricing.button.getStarted'),
            variant: 'outline' as const
        },
        {
            id: 'pro',
            name: t('pricing.plan.pro'),
            desc: t('pricing.plan.pro.desc'),
            price: billingCycle === 'monthly' ? '€49' : '€39',
            popular: true,
            features: [
                t('pricing.feature.shiftLogs'),
                t('pricing.feature.matrixRoster'),
                t('pricing.feature.aiAssistant'),
                t('pricing.feature.unlimitedLogs'),
                t('pricing.feature.prioritySupport')
            ],
            icon: Star,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
            buttonText: t('pricing.button.getStarted'),
            variant: 'default' as const
        },
        {
            id: 'enterprise',
            name: t('pricing.plan.enterprise'),
            desc: t('pricing.plan.enterprise.desc'),
            price: t('pricing.price.custom'),
            features: [
                t('pricing.feature.multiHotel'),
                t('pricing.feature.apiAccess'),
                t('pricing.feature.whiteLabel'),
                t('pricing.feature.customSupport')
            ],
            icon: Shield,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            buttonText: t('pricing.button.contact'),
            variant: 'outline' as const
        }
    ]

    const faqs = [
        { q: t('pricing.faq.q1'), a: t('pricing.faq.a1') },
        { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 relative overflow-hidden flex flex-col">
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

            <div className="container mx-auto px-6 pb-32 relative z-10 flex-grow">
                {/* Header */}
                <div className="text-center mb-24 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.85]">
                            Fair pricing for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-400 to-rose-400">modern hotels</span>.
                        </h1>
                        <p className="text-2xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-16 font-medium">
                            {t('pricing.subtitle')}
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-6 p-2 rounded-2xl bg-white/5 border border-white/10 w-fit mx-auto backdrop-blur-xl">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {t('pricing.monthly')}
                            </button>
                            <button
                                onClick={() => setBillingCycle('annual')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {t('pricing.annual')}
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] uppercase tracking-tighter shadow-sm shadow-emerald-500/50">
                                    -20%
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-40 items-stretch">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-12 rounded-[3.5rem] border transition-all duration-500 group flex flex-col ${plan.popular
                                ? 'bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/40 shadow-2xl shadow-indigo-500/10'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-12 px-6 py-2.5 bg-indigo-500 text-[10px] font-black tracking-[0.2em] text-white rounded-b-2xl uppercase shadow-lg shadow-indigo-500/30">
                                    {t('pricing.popular')}
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-10">
                                <div className={`w-14 h-14 rounded-2xl ${plan.bg} border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                                    <plan.icon className={`w-7 h-7 ${plan.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Entry Level</p>
                                </div>
                            </div>

                            <div className="mb-12">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black tracking-tighter text-white">{plan.price}</span>
                                    {plan.price !== 'Custom' && plan.price !== 'Kişiye Özel' && (
                                        <span className="text-zinc-500 text-lg font-bold">/{t('common.month')}</span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-lg mt-4 leading-relaxed font-normal italic opacity-80">
                                    "{plan.desc}"
                                </p>
                            </div>

                            <div className="space-y-5 mb-12 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center mt-0.5 group-hover:bg-indigo-500/20 transition-colors">
                                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                        <span className="text-zinc-300 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.variant}
                                className={`w-full py-8 rounded-[2rem] font-black text-lg transition-all duration-300 relative overflow-hidden group/btn ${plan.popular
                                    ? 'bg-white text-black hover:bg-zinc-100 shadow-2xl shadow-indigo-500/20 active:scale-[0.98]'
                                    : 'border-white/10 text-white hover:bg-white/10'
                                    }`}
                                onClick={() => navigate(plan.id === 'lite' ? '/register' : '/contact')}
                            >
                                <span className="relative z-10">{plan.buttonText}</span>
                                {plan.popular && (
                                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto pt-40 border-t border-white/5">
                    <div className="flex items-center gap-4 mb-16 justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-zinc-500" />
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter">{t('pricing.faq.title')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {faqs.map((faq, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <h4 className="text-xl font-black text-white mb-4 group-hover:text-indigo-400 transition-colors">{faq.q}</h4>
                                <p className="text-zinc-500 text-lg leading-relaxed">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-24 p-12 rounded-[3rem] bg-indigo-600/10 border border-indigo-500/20 text-center">
                         <h4 className="text-2xl font-black text-white mb-4 italic">Still have questions?</h4>
                         <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
                             Our operations team is available 24/7 to discuss custom integrations and enterprise deployments.
                         </p>
                         <Button variant="link" className="text-indigo-400 font-black text-lg hover:text-white transition-colors" onClick={() => navigate('/contact')}>
                             Contact Support →
                         </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="h-[300px] w-full bg-gradient-to-t from-indigo-500/10 to-transparent mt-32" />
        </div>
    )
}
