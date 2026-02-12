import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User, Share2 } from 'lucide-react'

export function BlogPostPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useLanguageStore()

    // Mock data matching the BlogPage content but with full text
    const postsContent: Record<string, any> = {
        '1': {
            title: t('blog.post1.title'),
            content: t('blog.post1.content'),
            date: t('blog.post1.date'),
            author: t('blog.author.team'),
            category: t('blog.category.hospitality'),
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
        },
        '2': {
            title: t('blog.post2.title'),
            content: t('blog.post2.content'),
            date: t('blog.post2.date'),
            author: t('blog.author.strategy'),
            category: t('blog.category.ai'),
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
        }
    }

    const post = postsContent[id || '1']

    if (!post) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
                    <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 pb-32">
            {/* Navigation */}
            <div className="container mx-auto px-6 pt-32">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white group transition-colors mb-12"
                    onClick={() => navigate('/blog')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('common.back')}
                </Button>
            </div>

            <article className="container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="relative aspect-video rounded-[3rem] overflow-hidden mb-12 border border-white/10 shadow-2xl">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-8 left-8 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-widest uppercase">
                            {post.category}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-zinc-500 text-sm mb-8">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {post.date}
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {post.author}
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black mb-12 leading-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                        {post.title}
                    </h1>

                    <div className="prose prose-invert prose-lg max-w-none">
                        <p className="text-zinc-300 text-xl leading-relaxed mb-8">
                            {post.content}
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                            Morbi feugiat, magna sed semper varius, nulla sem dignissim turpis, sed posuere mauris lectus ut libero.
                            Curabitur non ex urna. Vestibulum vitae ex diam. Etiam et hendrerit risus.
                            Duis vel libero lectus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
                            Suspendisse eget elementum augue, eget porta tellus.
                        </p>
                    </div>

                    <div className="mt-20 pt-10 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Share2 className="w-5 h-5 text-indigo-400" />
                            <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Share Insight</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                                <span className="text-xs font-bold">In</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                                <span className="text-xs font-bold">X</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </article>
        </div>
    )
}
