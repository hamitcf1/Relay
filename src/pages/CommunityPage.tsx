import { motion } from 'framer-motion'
import { MessageSquare, Users, Globe, ArrowLeft, Send, Github, Twitter, ExternalLink } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface CommunityPageProps {
    onBack?: () => void
}

export function CommunityPage({ onBack }: CommunityPageProps) {
    const { t } = useLanguageStore()
    const [email, setEmail] = useState('')

    const communities = [
        { icon: MessageSquare, name: 'Discord', desc: 'Active community of hoteliers and front desk staff.', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { icon: Globe, name: 'Forum', desc: 'Discuss best practices and share workflows.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { icon: Users, name: 'Beta Group', desc: 'Early access to upcoming features.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">
            <div className="container mx-auto px-6 pt-12 mb-8">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white px-0 hover:bg-transparent"
                    onClick={onBack}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('common.back')}
                </Button>
            </div>

            <div className="container mx-auto px-6 pb-24">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        {t('community.title')}
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        {t('community.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-12">
                    {communities.map((item, idx) => {
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04, duration: 0.3 }}
                                className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col"
                            >
                                <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-4`}>
                                    <Icon className={`w-4 h-4 ${item.color}`} aria-hidden="true" />
                                </div>
                                <h3 className="text-base font-semibold mb-2 tracking-tight">{item.name}</h3>
                                <p className="text-zinc-400 text-sm mb-5 flex-1 leading-relaxed">
                                    {item.desc}
                                </p>
                                <Button variant="outline" size="sm" className="w-full border-zinc-700 text-white hover:bg-zinc-800" asChild>
                                    <a href="#">
                                        {t('community.join')}
                                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                    </a>
                                </Button>
                            </motion.div>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <h3 className="text-base font-semibold mb-2 flex items-center gap-2 tracking-tight">
                            <Send className="text-primary w-4 h-4" aria-hidden="true" /> {t('community.newsletter.title')}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-4">
                            {t('community.newsletter.desc')}
                        </p>
                        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault() }}>
                            <label htmlFor="newsletter-email" className="sr-only">{t('auth.email')}</label>
                            <input
                                id="newsletter-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('community.newsletter.placeholder') as string}
                                className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                            />
                            <Button type="submit" size="sm">{t('community.newsletter.subscribe')}</Button>
                        </form>
                    </div>

                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <h3 className="text-base font-semibold mb-4 tracking-tight">{t('community.social.title')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <a href="#" className="flex items-center gap-2 px-3 h-9 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors text-sm">
                                <Twitter className="w-4 h-4 text-blue-400" aria-hidden="true" />
                                <span className="font-medium">Twitter</span>
                            </a>
                            <a href="#" className="flex items-center gap-2 px-3 h-9 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors text-sm">
                                <Github className="w-4 h-4" aria-hidden="true" />
                                <span className="font-medium">GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
