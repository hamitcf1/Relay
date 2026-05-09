import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User } from 'lucide-react'

export function BlogPostPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useLanguageStore()

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
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-3 tracking-tight">{t('blog.notFound.title')}</h1>
                    <p className="text-zinc-400 mb-5">{t('blog.notFound.desc')}</p>
                    <Button onClick={() => navigate('/blog')}>{t('blog.notFound.back')}</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">
            <div className="container mx-auto px-6 pt-12 mb-8">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white px-0 hover:bg-transparent"
                    onClick={() => navigate('/blog')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('common.back')}
                </Button>
            </div>

            <article className="container mx-auto px-6 max-w-3xl pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="mb-6">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider mb-3">
                            {post.category}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4 text-zinc-500 text-sm">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                {post.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" aria-hidden="true" />
                                {post.author}
                            </span>
                        </div>
                    </div>

                    <div className="aspect-[16/9] rounded-xl overflow-hidden mb-8 border border-zinc-800">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>

                    <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-p:leading-relaxed">
                        <p className="text-zinc-300 text-lg leading-relaxed">
                            {post.content}
                        </p>
                    </div>
                </motion.div>
            </article>
        </div>
    )
}
