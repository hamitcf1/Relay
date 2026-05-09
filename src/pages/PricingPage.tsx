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
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30 flex flex-col">
            {/* Navigation Backlink */}
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

            <div className="container mx-auto px-6 pb-24 flex-grow">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            {t('pricing.title')}
                        </h1>
                        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10">
                            {t('pricing.subtitle')}
                        </p>

                        {/* Billing Toggle */}
                        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-zinc-800">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {t('pricing.monthly')}
                            </button>
                            <button
                                onClick={() => setBillingCycle('annual')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${billingCycle === 'annual' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {t('pricing.annual')}
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                                    −20%
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24 max-w-5xl mx-auto items-stretch">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-6 rounded-2xl border flex flex-col transition-colors ${plan.popular
                                ? 'bg-zinc-900 border-primary/40 ring-1 ring-primary/20'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 bg-primary text-[10px] font-semibold tracking-wide text-primary-foreground rounded-full uppercase">
                                    {t('pricing.popular')}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-9 h-9 rounded-lg ${plan.bg} flex items-center justify-center`}>
                                    <plan.icon className={`w-4 h-4 ${plan.color}`} aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                                    {plan.price !== 'Custom' && plan.price !== 'Kişiye Özel' && (
                                        <span className="text-zinc-500 text-sm">/ {t('common.month')}</span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                                    {plan.desc}
                                </p>
                            </div>

                            <ul className="space-y-2.5 mb-6 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                                        <span className="text-zinc-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.variant}
                                className={`w-full ${plan.popular ? '' : 'border-zinc-700 text-white hover:bg-zinc-800'}`}
                                onClick={() => navigate(plan.id === 'lite' ? '/register' : '/contact')}
                            >
                                {plan.buttonText}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto pt-16 border-t border-zinc-800">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <HelpCircle className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                        <h2 className="text-2xl font-bold text-white tracking-tight">{t('pricing.faq.title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800"
                            >
                                <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                        <h3 className="text-base font-semibold text-white mb-2">{t('pricing.needHelp')}</h3>
                        <p className="text-zinc-400 text-sm mb-4 max-w-md mx-auto">
                            {t('pricing.subtitle')}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/contact')}>
                            {t('pricing.contactSales')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
