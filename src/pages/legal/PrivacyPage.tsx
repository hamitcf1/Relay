import { motion } from 'framer-motion'

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

export function PrivacyPage() {
    const { t } = useLanguageStore()

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden">


            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 py-12 relative z-10 max-w-3xl">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {t('auth.backToHome')}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{t('privacy.title')}</h1>
                    <p className="text-zinc-500 mb-12">{t('privacy.lastUpdated')}</p>

                    <div className="space-y-8 text-zinc-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.intro.title')}</h2>
                            <p className="mb-4">
                                {t('privacy.intro.desc')}
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                                <li>{t('privacy.intro.list1')}</li>
                                <li>{t('privacy.intro.list2')}</li>
                                <li>{t('privacy.intro.list3')}</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.use.title')}</h2>
                            <p>
                                {t('privacy.use.desc')}
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-zinc-400 mt-4">
                                <li>{t('privacy.use.list1')}</li>
                                <li>{t('privacy.use.list2')}</li>
                                <li>{t('privacy.use.list3')}</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.security.title')}</h2>
                            <p>
                                {t('privacy.security.desc')}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.contact.title')}</h2>
                            <p>
                                {t('privacy.contact.desc')} <a href="mailto:hamitfindik2@gmail.com" className="text-primary hover:underline">hamitfindik2@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
