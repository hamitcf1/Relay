import { motion } from 'framer-motion'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Check, Star, Zap, Shield, ArrowLeft } from 'lucide-react'
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
            icon: <Zap className="w-5 h-5 text-blue-400" />,
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
            icon: <Star className="w-5 h-5 text-indigo-400" />,
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
            icon: <Shield className="w-5 h-5 text-emerald-400" />,
            buttonText: t('pricing.button.contact'),
            variant: 'outline' as const
        }
    ]

    const faqs = [
        { q: t('pricing.faq.q1'), a: t('pricing.faq.a1') },
        { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') }
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
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
                    >
                        {t('pricing.title')}
                    </motion.h1>
                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-12">
                        {t('pricing.subtitle')}
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>
                            {t('pricing.monthly')}
                        </span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                            className="w-14 h-7 rounded-full bg-zinc-800 p-1 relative transition-colors hover:bg-zinc-700"
                        >
                            <motion.div
                                animate={{ x: billingCycle === 'annual' ? 28 : 0 }}
                                className="w-5 h-5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
                            />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-white' : 'text-zinc-500'}`}>
                                {t('pricing.annual')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                {t('pricing.saveBadge')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 group overflow-hidden ${plan.popular
                                ? 'bg-indigo-500/5 border-indigo-500/30'
                                : 'bg-white/5 border-white/10'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 px-6 py-2 bg-indigo-500 text-[10px] font-black tracking-widest text-white rounded-bl-2xl uppercase">
                                    {t('pricing.popular')}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center">
                                    {plan.icon}
                                </div>
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">{plan.price}</span>
                                    {plan.price !== 'Custom' && (
                                        <span className="text-zinc-500 text-sm">/{t('common.month')}</span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                                    {plan.desc}
                                </p>
                            </div>

                            <div className="space-y-4 mb-10">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center mt-0.5">
                                            <Check className="w-3 h-3 text-indigo-400" />
                                        </div>
                                        <span className="text-zinc-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.variant}
                                className={`w-full h-14 rounded-2xl font-bold text-base transition-all duration-300 ${plan.popular
                                    ? 'bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-500/20'
                                    : 'hover:bg-white/10'
                                    }`}
                                onClick={() => navigate(plan.id === 'lite' ? '/register' : '/contact')}
                            >
                                {plan.buttonText}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto border-t border-white/5 pt-32">
                    <h2 className="text-3xl font-bold text-center mb-16">{t('pricing.faq.title')}</h2>
                    <div className="space-y-6">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10">
                                <h4 className="text-lg font-bold mb-3">{faq.q}</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
