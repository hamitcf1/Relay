import { motion } from 'framer-motion'

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

export function TermsPage() {
    const { t } = useLanguageStore()

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 relative overflow-hidden">


            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-500/5 to-transparent" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{t('terms.title')}</h1>
                    <p className="text-zinc-500 mb-12">{t('terms.lastUpdated')}</p>

                    <div className="space-y-8 text-zinc-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.acceptance.title')}</h2>
                            <p>
                                {t('terms.acceptance.desc')}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.license.title')}</h2>
                            <p>
                                {t('terms.license.desc')}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.responsibilities.title')}</h2>
                            <p>
                                {t('terms.responsibilities.desc')}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.availability.title')}</h2>
                            <p>
                                {t('terms.availability.desc')}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.contact.title')}</h2>
                            <p>
                                {t('terms.contact.desc')} <a href="mailto:hamitfindik2@gmail.com" className="text-blue-400 hover:underline">hamitfindik2@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
