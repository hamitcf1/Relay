import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Hotel, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import { useLanguageStore } from '@/stores/languageStore'

export function LiveDemoPage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const { t } = useLanguageStore()

    const startDemo = async (role: 'gm' | 'receptionist') => {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 400))
        await useAuthStore.getState().loginAsDemo(role)
        navigate('/dashboard')
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30 flex flex-col">
            <div className="container mx-auto px-6 pt-12 mb-8">
                <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    {t('demo.back')}
                </Link>
            </div>

            <div className="container mx-auto px-6 pb-24 flex-1 flex flex-col justify-center">
                <div className="max-w-xl mx-auto text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">{t('demo.title')}</h1>
                        <p className="text-zinc-400">
                            {t('demo.subtitle')}
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
                    <DemoCard
                        icon={Hotel}
                        title={t('demo.gm')}
                        desc={t('demo.gm.desc')}
                        cta={t('demo.enter.gm')}
                        onClick={() => startDemo('gm')}
                        loading={isLoading}
                        accent="text-primary bg-primary/10"
                    />
                    <DemoCard
                        icon={User}
                        title={t('demo.staff')}
                        desc={t('demo.staff.desc')}
                        cta={t('demo.enter.staff')}
                        onClick={() => startDemo('receptionist')}
                        loading={isLoading}
                        accent="text-blue-400 bg-blue-400/10"
                    />
                </div>
            </div>
        </div>
    )
}

function DemoCard({ icon: Icon, title, desc, cta, onClick, loading, accent }: {
    icon: typeof Hotel
    title: string
    desc: string
    cta: string
    onClick: () => void
    loading: boolean
    accent: string
}) {
    return (
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col">
            <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center mb-4`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1.5 tracking-tight">{title}</h2>
            <p className="text-zinc-400 text-sm mb-5 flex-1 leading-relaxed">{desc}</p>
            <Button onClick={onClick} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : cta}
            </Button>
        </div>
    )
}
