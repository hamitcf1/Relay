import { motion } from 'framer-motion'
import { Smartphone, Monitor, Download, Apple, Chrome, ArrowLeft, ArrowRight } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface DownloadPageProps {
    onBack?: () => void
}

interface PlatformCard {
    icon: typeof Apple
    name: string
    sub: string
    color: string
    bg: string
    available: boolean
    onClick?: () => void
}

export function DownloadPage({ onBack }: DownloadPageProps) {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const platforms: PlatformCard[] = [
        {
            icon: Chrome,
            name: 'Web App',
            sub: t('landing.getApp.webAppSub'),
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            available: true,
            onClick: () => navigate('/login'),
        },
        {
            icon: Apple,
            name: 'iOS',
            sub: t('landing.getApp.appStoreSub'),
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            available: false,
        },
        {
            icon: Smartphone,
            name: 'Android',
            sub: t('landing.getApp.googlePlaySub'),
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            available: false,
        },
        {
            icon: Monitor,
            name: 'Desktop',
            sub: 'Windows / macOS',
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
            available: false,
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
                        {t('download.title')}
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        {t('download.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {platforms.map((platform, idx) => {
                        const Icon = platform.icon
                        return (
                            <motion.div
                                key={platform.name}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04, duration: 0.3 }}
                                className={cn(
                                    "p-5 rounded-xl border flex flex-col",
                                    platform.available
                                        ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
                                        : "bg-zinc-900/20 border-zinc-900 opacity-70"
                                )}
                            >
                                <div className={`w-9 h-9 rounded-lg ${platform.bg} flex items-center justify-center mb-4`}>
                                    <Icon className={`w-4 h-4 ${platform.color}`} aria-hidden="true" />
                                </div>
                                <div className="mb-1 flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-semibold tracking-tight">{platform.name}</h3>
                                    {!platform.available && (
                                        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            {t('community.comingSoon')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-sm mb-4 flex-1">{platform.sub}</p>
                                {platform.available ? (
                                    <Button size="sm" onClick={platform.onClick} className="w-full">
                                        {t('landing.getApp.webApp')}
                                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="outline" disabled className="w-full border-zinc-800 text-zinc-500">
                                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                        {t('community.comingSoon')}
                                    </Button>
                                )}
                            </motion.div>
                        )
                    })}
                </div>

                <div className="mt-12 max-w-3xl mx-auto p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <h2 className="text-xl font-semibold mb-2 tracking-tight">{t('download.enterprise.title')}</h2>
                    <p className="text-zinc-400 text-sm mb-5 max-w-md mx-auto">
                        {t('download.enterprise.desc')}
                    </p>
                    <Button asChild>
                        <a href="mailto:hamitfindik2@gmail.com">{t('download.enterprise.cta')}</a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
