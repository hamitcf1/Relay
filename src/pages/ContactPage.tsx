import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react'

export function ContactPage() {
    const navigate = useNavigate()
    const { t } = useLanguageStore()

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
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        {t('auth.contactSales')}
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Ready to transform your hotel operations? Our team is here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    <ContactCard
                        icon={Mail}
                        color="text-blue-400"
                        bg="bg-blue-400/10"
                        title="Email"
                        desc="For pricing and custom plans."
                        value="sales@relay.app"
                        action="Email Us"
                        href="mailto:sales@relay.app"
                    />
                    <ContactCard
                        icon={MessageSquare}
                        color="text-emerald-400"
                        bg="bg-emerald-400/10"
                        title="Live Chat"
                        desc="Talk to our specialists 24/7."
                        value="In-app chat"
                        action="Start Chat"
                        href="#"
                    />
                    <ContactCard
                        icon={Phone}
                        color="text-indigo-400"
                        bg="bg-indigo-400/10"
                        title="Schedule"
                        desc="Book a discovery call."
                        value="30 min slot"
                        action="Request Call"
                        href="tel:+15551234567"
                    />
                </div>
            </div>
        </div>
    )
}

function ContactCard({ icon: Icon, color, bg, title, desc, value, action, href }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col"
        >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold mb-1.5 tracking-tight">{title}</h3>
            <p className="text-zinc-400 text-sm mb-3">{desc}</p>
            <div className="text-white text-sm font-medium mb-5 flex-1">{value}</div>
            <Button variant="outline" size="sm" className="w-full border-zinc-700 text-white hover:bg-zinc-800" asChild>
                <a href={href}>{action}</a>
            </Button>
        </motion.div>
    )
}
