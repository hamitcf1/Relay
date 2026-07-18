import { motion } from 'framer-motion'
import { MessageSquare, ArrowLeft, Github, Mail, ExternalLink } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CommunityPageProps {
    onBack?: () => void
}

interface ChannelCard {
    icon: typeof Github
    color: string
    bg: string
    title: string
    desc: string
    href?: string
    cta: string
    soon?: boolean
}

export function CommunityPage({ onBack }: CommunityPageProps) {
    const { t } = useLanguageStore()

    const channels: ChannelCard[] = [
        {
            icon: Github,
            color: 'text-zinc-300',
            bg: 'bg-zinc-700/30',
            title: t('community.github.title'),
            desc: t('community.github.desc'),
            href: 'https://github.com/hamitcf1/Relay',
            cta: t('community.github.cta'),
        },
        {
            icon: Mail,
            color: 'text-primary',
            bg: 'bg-primary/10',
            title: t('community.email.title'),
            desc: t('community.email.desc'),
            href: 'mailto:hamitfindik2@gmail.com',
            cta: t('community.email.cta'),
        },
        {
            icon: MessageSquare,
            color: 'text-primary',
            bg: 'bg-primary/10',
            title: t('community.discord.title'),
            desc: t('community.discord.desc'),
            cta: t('community.comingSoon'),
            soon: true,
        },
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {channels.map((c, i) => {
                        const Icon = c.icon
                        const Wrapper = c.href ? 'a' : 'div'
                        const wrapperProps = c.href
                            ? { href: c.href, target: c.href.startsWith('http') ? '_blank' : undefined, rel: c.href.startsWith('http') ? 'noopener noreferrer' : undefined }
                            : {}

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                            >
                                <Wrapper
                                    {...wrapperProps}
                                    className={cn(
                                        "block p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 transition-colors h-full",
                                        c.href ? "hover:border-zinc-700 hover:bg-zinc-900" : "opacity-60"
                                    )}
                                >
                                    <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                                        <Icon className={`w-4 h-4 ${c.color}`} aria-hidden="true" />
                                    </div>
                                    <h3 className="text-base font-semibold mb-2 tracking-tight flex items-center gap-2">
                                        {c.title}
                                        {c.soon && (
                                            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                {t('community.comingSoon')}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
                                        {c.desc}
                                    </p>
                                    <div className={cn(
                                        "inline-flex items-center gap-2 text-sm font-medium",
                                        c.soon ? "text-zinc-500" : "text-primary"
                                    )}>
                                        {c.cta}
                                        {!c.soon && <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />}
                                    </div>
                                </Wrapper>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
