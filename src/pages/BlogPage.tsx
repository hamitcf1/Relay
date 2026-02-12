import { motion } from 'framer-motion'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User, ChevronRight } from 'lucide-react'

export function BlogPage() {
    const { t } = useLanguageStore()
    const navigate = useNavigate()

    const posts = [
        {
            title: t('blog.post1.title'),
            excerpt: t('blog.post1.excerpt'),
            date: t('blog.post1.date'),
            author: t('blog.author.team'),
            category: t('blog.category.hospitality'),
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            title: t('blog.post2.title'),
            excerpt: t('blog.post2.excerpt'),
            date: t('blog.post2.date'),
            author: t('blog.author.strategy'),
            category: t('blog.category.ai'),
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
            {/* Navigation Backlink */}
            <div className="container mx-auto px-6 pt-32">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white group transition-colors"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('common.backToHome')}
                </Button>
            </div>

            <div className="container mx-auto px-6 py-20">
                <div className="text-center mb-20 pt-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                    >
                        {t('blog.title')}
                    </motion.h1>
                    <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                        {t('blog.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {posts.map((post, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group cursor-pointer"
                            onClick={() => navigate(`/blog/${i + 1}`)}
                        >
                            <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden mb-8 border border-white/10">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-widest uppercase">
                                    {post.category}
                                </div>
                            </div>

                            <div className="px-4">
                                <div className="flex items-center gap-6 text-zinc-500 text-xs mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        {post.author}
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold mb-4 group-hover:text-indigo-400 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-zinc-400 leading-relaxed mb-6 italic">
                                    "{post.excerpt}"
                                </p>
                                <div className="flex items-center gap-2 text-indigo-400 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-[10px]">
                                    {t('blog.readMore')} <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
