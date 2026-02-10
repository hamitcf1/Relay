import { motion } from 'framer-motion'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PricingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden">
            <CustomCursor />

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-gradient-to-b from-indigo-500/10 to-transparent" />
                <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px]" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5">
                <Link to="/" className="flex items-center gap-3 group">
                    <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="font-bold text-xl tracking-tight text-white">Back</span>
                </Link>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-zinc-400 hidden sm:block">Need help choosing?</p>
                    <a href="mailto:hamitfindik2@gmail.com" className="text-sm text-white underline hover:text-primary">Contact Sales</a>
                </div>
            </nav>

            <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Plans & Pricing</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Simple, transparent pricing that grows with your business. No hidden fees.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
                    <PricingCard
                        title="Starter"
                        price="$0"
                        desc="For small boutique hotels getting started."
                        features={[
                            'Up to 5 Staff Types',
                            'Basic Handover Logs',
                            '7-Day History Retention',
                            'Standard Email Support',
                            'Basic Analytics'
                        ]}
                        buttonText="Start Free"
                        onAction={() => navigate('/register')}
                    />
                    <PricingCard
                        title="Pro"
                        price="$49"
                        desc="For growing hotels needing automation."
                        isPopular
                        features={[
                            'Unlimited Staff',
                            'Automated Shift Reminders',
                            'Unlimited History',
                            'Priority 24/7 Support',
                            'Advanced Analytics & Export',
                            'Custom Role Permissions',
                            'Multi-language Support'
                        ]}
                        buttonText="Start Trial"
                        onAction={() => navigate('/register')}
                    />
                    <PricingCard
                        title="Enterprise"
                        price="Custom"
                        desc="For hotel chains and large resorts."
                        features={[
                            'Multi-Property Management',
                            'Custom API Integrations',
                            'Dedicated Success Manager',
                            'SLA Guarantees',
                            'On-premise Deployment',
                            'Custom Branding',
                            'SSO Authentication'
                        ]}
                        buttonText="Contact Sales"
                        onAction={() => window.location.href = 'mailto:hamitfindik2@gmail.com'}
                    />
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <FAQItem
                            q="Can I upgrade later?"
                            a="Yes, you can upgrade or downgrade your plan at any time directly from the dashboard."
                        />
                        <FAQItem
                            q="Is there a free trial for Pro?"
                            a="Absolutely. You get 14 days of free Pro access when you sign up, no credit card required."
                        />
                        <FAQItem
                            q="What payment methods do you accept?"
                            a="We accept all major credit cards (Visa, Mastercard, Amex) and bank transfers for Enterprise plans."
                        />
                        <FAQItem
                            q="Is my data secure?"
                            a="Yes. We use industry-standard encryption for data in transit and at rest. We never sell your data."
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
            className={`p-8 rounded-3xl border flex flex-col relative ${isPopular ? 'bg-white/10 border-primary/50 shadow-2xl shadow-primary/10' : 'bg-white/5 border-white/10'}`}
        >
            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/40">
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
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-zinc-500" />
                {q}
            </h3>
            <p className="text-zinc-400 pl-7">{a}</p>
        </div>
    )
}
