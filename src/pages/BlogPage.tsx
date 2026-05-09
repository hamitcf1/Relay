import { motion } from 'framer-motion'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User } from 'lucide-react'

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
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">
            <div className="container mx-auto px-6 pt-12 mb-8">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white px-0 hover:bg-transparent"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('common.backToHome')}
                </Button>
            </div>

            <div className="container mx-auto px-6 pb-24">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        {t('blog.title')}
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        {t('blog.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
                    {posts.map((post, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            onClick={() => navigate(`/blog/${i + 1}`)}
                            className="group text-left rounded-xl overflow-hidden bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            <div className="relative aspect-[16/9] overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider">
                                    {post.category}
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center gap-3 text-zinc-500 text-xs mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" aria-hidden="true" />
                                        {post.date}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-3 h-3" aria-hidden="true" />
                                        {post.author}
                                    </span>
                                </div>
                                <h3 className="text-base font-semibold mb-2 tracking-tight group-hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    {post.excerpt}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    )
}
