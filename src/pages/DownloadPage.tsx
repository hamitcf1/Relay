import { motion } from 'framer-motion'
import { Smartphone, Monitor, Download, Apple, Chrome, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'
import { Button } from '@/components/ui/button'

interface DownloadPageProps {
    onBack?: () => void
}

export function DownloadPage({ onBack }: DownloadPageProps) {
    const { t } = useLanguageStore()

    const platforms = [
        { icon: Apple, name: 'iOS', sub: t('landing.getApp.appStoreSub'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { icon: Smartphone, name: 'Android', sub: t('landing.getApp.googlePlaySub'), color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { icon: Chrome, name: 'Web App', sub: t('landing.getApp.webAppSub'), color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { icon: Monitor, name: 'Desktop', sub: 'Windows / macOS', color: 'text-orange-400', bg: 'bg-orange-400/10' }
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
                                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col"
                            >
                                <div className={`w-9 h-9 rounded-lg ${platform.bg} flex items-center justify-center mb-4`}>
                                    <Icon className={`w-4 h-4 ${platform.color}`} aria-hidden="true" />
                                </div>
                                <h3 className="text-base font-semibold mb-1 tracking-tight">{platform.name}</h3>
                                <p className="text-zinc-400 text-sm mb-4 flex-1">{platform.sub}</p>
                                <Button size="sm" variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                    Download
                                </Button>
                            </motion.div>
                        )
                    })}
                </div>

                <div className="mt-12 max-w-3xl mx-auto p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <h2 className="text-xl font-semibold mb-2 tracking-tight">Enterprise deployment?</h2>
                    <p className="text-zinc-400 text-sm mb-5 max-w-md mx-auto">
                        White-label builds and private MDM packages for hotel groups.
                    </p>
                    <Button>Talk to Enterprise Sales</Button>
                </div>
            </div>
        </div>
    )
}
