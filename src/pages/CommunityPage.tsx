import { motion } from 'framer-motion';
import { MessageSquare, Users, Globe, ArrowLeft, Send, Github, Twitter, ExternalLink } from 'lucide-react';
import { useLanguageStore } from '../stores/languageStore';

interface CommunityPageProps {
    onBack?: () => void;
}

export function CommunityPage({ onBack }: CommunityPageProps) {
    const { t } = useLanguageStore();

    const communities = [
        {
            icon: <MessageSquare className="w-8 h-8" />,
            name: 'Discord Server',
            desc: 'Join our active community of 5,000+ hoteliers and front desk staff.',
            count: '5,240 Members',
            btnText: 'Join Discord',
            color: 'from-indigo-500 to-blue-600',
            link: '#'
        },
        {
            icon: <Globe className="w-8 h-8" />,
            name: 'Community Forum',
            desc: 'Discuss best practices, share workflows, and get help from the community.',
            count: '12,000+ Posts',
            btnText: 'Visit Forum',
            color: 'from-fuchsia-500 to-purple-600',
            link: '#'
        },
        {
            icon: <Users className="w-8 h-8" />,
            name: 'Beta Group',
            desc: 'Get early access to upcoming features and help shape the future of Relay.',
            count: 'Experimental',
            btnText: 'Register for Beta',
            color: 'from-emerald-500 to-teal-600',
            link: '#'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-12">
            <motion.button
                onClick={onBack}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12"
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
                        {t('community.title')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl"
                    >
                        {t('community.subtitle')}
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {communities.map((item, idx) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.07] transition-all duration-300"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-300`}>
                                {item.icon}
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold">{item.name}</h3>
                                <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-purple-300 border border-white/10">
                                    {item.count}
                                </span>
                            </div>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                {item.desc}
                            </p>
                            <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300 font-bold flex items-center justify-center gap-2 group-hover:border-transparent">
                                {item.btnText} <ExternalLink className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-10 rounded-[40px] bg-gradient-to-br from-[#121214] to-[#0a0a0b] border border-white/10"
                    >
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Send className="text-purple-400 w-6 h-6" /> Stay Updated
                        </h3>
                        <p className="text-gray-400 mb-8">
                            Subscribe to our engineering blog and newsletter for technical deep dives and product updates.
                        </p>
                        <div className="flex gap-3">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-purple-500 transition-colors"
                            />
                            <button className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-10 rounded-[40px] bg-gradient-to-br from-[#121214] to-[#0a0a0b] border border-white/10 flex flex-col justify-center"
                    >
                        <h3 className="text-2xl font-bold mb-6">Social Channels</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <a href="#" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300">
                                <Twitter className="w-5 h-5 text-blue-400" /> <span className="font-medium">Twitter</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300">
                                <Github className="w-5 h-5" /> <span className="font-medium">GitHub</span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
