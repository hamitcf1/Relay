import { motion } from 'framer-motion';
import { Smartphone, Monitor, Download, Apple, Chrome, ArrowLeft } from 'lucide-react';
import { useLanguageStore } from '../stores/languageStore';

interface DownloadPageProps {
    onBack?: () => void;
}

export function DownloadPage({ onBack }: DownloadPageProps) {
    const { t } = useLanguageStore();

    const platforms = [
        {
            icon: <Apple className="w-8 h-8" />,
            name: 'iOS App',
            sub: t('landing.getApp.appStoreSub'),
            btn: t('landing.getApp.appStore'),
            color: 'from-blue-500 to-indigo-600'
        },
        {
            icon: <Smartphone className="w-8 h-8" />,
            name: 'Android APK',
            sub: t('landing.getApp.googlePlaySub'),
            btn: t('landing.getApp.googlePlay'),
            color: 'from-emerald-500 to-teal-600'
        },
        {
            icon: <Chrome className="w-8 h-8" />,
            name: 'Web App',
            sub: t('landing.getApp.webAppSub'),
            btn: t('landing.getApp.webApp'),
            color: 'from-purple-500 to-pink-600'
        },
        {
            icon: <Monitor className="w-8 h-8" />,
            name: 'Desktop',
            sub: 'Windows / macOS',
            btn: 'Download v1.2.0',
            color: 'from-orange-500 to-red-600'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-12">
            <motion.button
                onClick={onBack}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 drop-shadow-md"
            >
                <ArrowLeft className="w-5 h-5" /> {t('common.back')}
            </motion.button>

            <div className="max-w-6xl mx-auto">
                <header className="mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400"
                    >
                        {t('download.title')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl"
                    >
                        {t('download.subtitle')}
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {platforms.map((platform, idx) => (
                        <motion.div
                            key={platform.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <div className="text-purple-400">
                                        {platform.icon}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{platform.name}</h3>
                                <p className="text-gray-400 mb-8">{platform.sub}</p>
                                <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-black font-bold hover:bg-purple-500 hover:text-white transition-all duration-300">
                                    <Download className="w-5 h-5" /> {platform.btn}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 p-12 rounded-[40px] bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-white/10 text-center"
                >
                    <h2 className="text-3xl font-bold mb-4">Enterprise Deployment?</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                        Need a custom white-label build for your hotel group? Our engineering team can provide private MDM packages and custom branding.
                    </p>
                    <button className="px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors font-bold shadow-xl shadow-purple-500/20">
                        Talk to Enterprise Sales
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
