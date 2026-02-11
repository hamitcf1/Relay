import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useLanguageStore } from '@/stores/languageStore'

export function PricingPage() {
    const navigate = useNavigate()
    const { t } = useLanguageStore()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

    const prices = {
        starter: { monthly: '$0', annual: '$0' },
        pro: { monthly: '$49', annual: '$39' },
        enterprise: { monthly: 'Custom', annual: 'Custom' }
    }

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden">


            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-gradient-to-b from-indigo-500/10 to-transparent" />
                <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px]" />
            </div>



            <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">{t('pricing.title')}</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
                            {t('pricing.subtitle')}
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-10">
                            <span className={`text-lg transition-colors cursor-pointer ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`} onClick={() => setBillingCycle('monthly')}>
                                {t('pricing.monthly')}
                            </span>

                            <button
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                                className="w-14 h-8 bg-zinc-800 rounded-full p-1 relative transition-colors hover:bg-zinc-700"
                            >
                                <motion.div
                                    className="w-6 h-6 bg-white rounded-full shadow-lg"
                                    animate={{ x: billingCycle === 'annual' ? 24 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </button>

                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBillingCycle('annual')}>
                                <span className={`text-lg transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-zinc-500'}`}>
                                    {t('pricing.annual')}
                                </span>
                                {billingCycle === 'annual' && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                                        {t('pricing.saveBadge')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
                    <PricingCard
                        title={t('pricing.plan.starter')}
                        price={prices.starter[billingCycle]}
                        desc={t('pricing.plan.starter.desc')}
                        features={[
                            t('pricing.feature.5staff'),
                            t('pricing.feature.logs'),
                            t('pricing.feature.7day'),
                            t('pricing.feature.support'),
                            t('pricing.feature.analytics')
                        ]}
                        buttonText={t('pricing.button.free')}
                        onAction={() => navigate('/register')}
                        billing={billingCycle}
                    />
                    <PricingCard
                        title={t('pricing.plan.pro')}
                        price={prices.pro[billingCycle]}
                        desc={t('pricing.plan.pro.desc')}
                        isPopular
                        features={[
                            t('pricing.feature.unlimited'),
                            t('pricing.feature.autoReminders'),
                            t('pricing.feature.unlimitedHistory'),
                            t('pricing.feature.prioritySupport'),
                            t('pricing.feature.advAnalytics'),
                            t('pricing.feature.roles'),
                            t('pricing.feature.multiLang')
                        ]}
                        buttonText={t('pricing.button.trial')}
                        onAction={() => navigate('/register')}
                        billing={billingCycle}
                    />
                    <PricingCard
                        title={t('pricing.plan.enterprise')}
                        price={'Custom'}
                        desc={t('pricing.plan.enterprise.desc')}
                        features={[
                            t('pricing.feature.multiProp'),
                            t('pricing.feature.api'),
                            t('pricing.feature.successManager'),
                            t('pricing.feature.sla'),
                            t('pricing.feature.onPrem'),
                            t('pricing.feature.branding'),
                            t('pricing.feature.sso')
                        ]}
                        buttonText={t('pricing.button.contact')}
                        onAction={() => window.location.href = 'mailto:hamitfindik2@gmail.com'}
                        billing={billingCycle}
                    />
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">{t('pricing.faq.title')}</h2>
                    <div className="space-y-6">
                        <FAQItem
                            q={t('pricing.faq.upgrade.q')}
                            a={t('pricing.faq.upgrade.a')}
                        />
                        <FAQItem
                            q={t('pricing.faq.trial.q')}
                            a={t('pricing.faq.trial.a')}
                        />
                        <FAQItem
                            q={t('pricing.faq.payment.q')}
                            a={t('pricing.faq.payment.a')}
                        />
                        <FAQItem
                            q={t('pricing.faq.security.q')}
                            a={t('pricing.faq.security.a')}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function PricingCard({ title, price, desc, features, buttonText, onAction, isPopular }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className={`p-8 rounded-3xl border flex flex-col relative transition-colors duration-300 ${isPopular ? 'bg-white/10 border-primary/50 shadow-2xl shadow-primary/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
        >
            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/40 whitespace-nowrap">
                    {/* Hardcoded 'Most Popular' or key, passed as prop or translated here */}
                    Most Popular
                </div>
            )}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 h-10">{desc}</p>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold text-white">{price}</span>
                {price !== 'Custom' && <span className="text-zinc-500">/mo</span>}
            </div>
            <div className="flex-1">
                <ul className="space-y-4 mb-8">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-zinc-300">
                            <Check className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm">{f}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Button
                onClick={onAction}
                className={`w-full h-14 rounded-xl font-bold text-base ${isPopular ? 'bg-primary hover:bg-primary/90' : 'bg-white text-black hover:bg-zinc-200'}`}
            >
                {buttonText}
            </Button>
        </motion.div>
    )
}

function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-zinc-500" />
                {q}
            </h3>
            <p className="text-zinc-400 pl-7">{a}</p>
        </div>
    )
}
