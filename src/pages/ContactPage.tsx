import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react'

export function ContactPage() {
    const navigate = useNavigate()
    const { t } = useLanguageStore()

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
            {/* Navigation */}
            <div className="container mx-auto px-6 pt-32">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white group transition-colors mb-12"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('common.backToHome')}
                </Button>
            </div>

            <div className="container mx-auto px-6 py-20">
                <div className="text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                    >
                        {t('auth.contactSales')}
                    </motion.h1>
                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                        Ready to transform your hotel operations? Our team is here to help you get started with the perfect plan.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <ContactCard
                        icon={<Mail className="w-8 h-8 text-blue-400" />}
                        title="Email"
                        desc="Reach out for pricing and custom implementation."
                        value="sales@relay.app"
                        action="Email Us"
                        href="mailto:sales@relay.app"
                    />
                    <ContactCard
                        icon={<MessageSquare className="w-8 h-8 text-emerald-400" />}
                        title="Live Support"
                        desc="Talk to our specialists about technical features."
                        value="24/7 Live Chat"
                        action="Start Chat"
                        href="#"
                    />
                    <ContactCard
                        icon={<Phone className="w-8 h-8 text-indigo-400" />}
                        title="Call"
                        desc="Schedule a discovery call with our experts."
                        value="+1 (555) 123-4567"
                        action="Request Call"
                        href="tel:+15551234567"
                    />
                </div>
            </div>
        </div>
    )
}

function ContactCard({ icon, title, desc, value, action, href }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center group"
        >
            <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <p className="text-zinc-500 mb-6 text-sm">{desc}</p>
            <div className="text-white font-bold mb-8">{value}</div>
            <Button variant="outline" className="w-full rounded-xl" asChild>
                <a href={href}>{action}</a>
            </Button>
        </motion.div>
    )
}
