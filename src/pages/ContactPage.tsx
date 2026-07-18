import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Github } from 'lucide-react'

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
                        {t('contact.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    <ContactCard
                        icon={Mail}
                        color="text-primary"
                        bg="bg-primary/10"
                        title={t('contact.email.title')}
                        desc={t('contact.email.desc')}
                        value="hamitfindik2@gmail.com"
                        action={t('contact.email.cta')}
                        href="mailto:hamitfindik2@gmail.com"
                    />
                    <ContactCard
                        icon={Github}
                        color="text-primary"
                        bg="bg-primary/10"
                        title={t('contact.github.title')}
                        desc={t('contact.github.desc')}
                        value="@hamitcf1"
                        action={t('contact.github.cta')}
                        href="https://github.com/hamitcf1"
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
