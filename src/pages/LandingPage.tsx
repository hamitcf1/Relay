import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
    Globe, Shield, Smartphone, Zap, Lock, BarChart3, Clock, Users, MessageSquare, Play,
    ArrowRight, Check, X, ChevronDown, FileText, ShieldCheck, Layers, Sparkles, Bot, KeyRound, BedDouble, CalendarDays
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useEffect, useState } from 'react'

const STAGGER = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
}

const FADE_UP = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
}

const STRUCTURED_DATA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Aetherius Relay",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "BusinessApplication",
    "description": "Digital handover and operations system for hotels.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}

export function LandingPage() {
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)
    const t = useLanguageStore(s => s.t)

    useEffect(() => {
        if (user) navigate('/dashboard')
    }, [user, navigate])

    return (
        <main className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 flex flex-col relative overflow-hidden">
            <script type="application/ld+json">
                {JSON.stringify(STRUCTURED_DATA)}
            </script>

            {/* Hero */}
            <HeroSection t={t} navigate={navigate} />

            {/* Stats */}
            <StatsSection t={t} />

            {/* Feature Card Grid */}
            <FeatureGrid t={t} />

            {/* Deep-dive Sections */}
            <DeepDive t={t} />

            {/* Comparison */}
            <ComparisonSection t={t} />

            {/* FAQ */}
            <FaqSection t={t} />

            {/* Final CTA */}
            <FinalCta t={t} navigate={navigate} />
        </main>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// HERO
// ────────────────────────────────────────────────────────────────────────────

function HeroSection({ t, navigate }: { t: any; navigate: any }) {
    return (
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-radial from-primary/25 via-purple-500/10 to-transparent blur-3xl" />
                <div className="absolute top-1/3 left-[10%] w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 right-[10%] w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent_50%,rgb(0_0_0/0.4)_100%)]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 70%)'
                    }}
                />
            </div>

            <div className="relative max-w-6xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 backdrop-blur-sm"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    {t('landing.hero.badge')}
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 leading-[1.02]"
                >
                    {t('landing.hero.title.prefix')}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                        {t('landing.hero.title.suffix')}
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10"
                >
                    {t('landing.hero.subtitle')}
                </motion.p>

                <motion.nav
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
                >
                    <Button
                        size="lg"
                        onClick={() => navigate('/pricing')}
                        className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-full active:scale-[0.98] transition-transform group"
                    >
                        {t('landing.hero.cta.primary')}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/live-demo')}
                        className="h-12 px-6 border-white/15 text-white hover:bg-white/5 rounded-full active:scale-[0.98] transition-transform"
                    >
                        <Play className="w-4 h-4 mr-1" aria-hidden="true" /> {t('landing.hero.cta.secondary')}
                    </Button>
                </motion.nav>

                {/* Product preview mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative max-w-5xl mx-auto"
                >
                    <ProductMockup t={t} />
                </motion.div>
            </div>
        </section>
    )
}

function ProductMockup({ t: _t }: { t: any }) {
    return (
        <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-[0_30px_80px_-20px_rgba(124,58,237,0.4)] overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/10 bg-zinc-900/60">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="ml-4 px-3 py-1 rounded-md bg-zinc-800/60 text-[10px] text-zinc-400 font-mono">
                    relay.hamitcf.info/dashboard
                </div>
            </div>

            {/* App area */}
            <div className="grid grid-cols-12 min-h-[420px]">
                {/* Sidebar */}
                <div className="col-span-2 border-r border-white/10 p-3 space-y-1 hidden md:block bg-zinc-950/50">
                    <div className="h-7 px-2 flex items-center gap-2 rounded-md bg-primary/10 text-primary">
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="text-xs font-medium">Overview</span>
                    </div>
                    {[Layers, MessageSquare, BedDouble, CalendarDays, BarChart3, Users, KeyRound].map((Icon, i) => (
                        <div key={i} className="h-7 px-2 flex items-center gap-2 rounded-md text-zinc-500">
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="text-xs">·····</span>
                        </div>
                    ))}
                </div>

                {/* Main */}
                <div className="col-span-12 md:col-span-10 p-4 md:p-6 space-y-4">
                    {/* Header strip */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3 h-3" aria-hidden="true" />
                                <span className="tabular-nums">5</span> Aktif
                            </div>
                            <div className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart3 className="w-3 h-3" aria-hidden="true" />
                                <span className="tabular-nums">12</span> Bugün
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full border-2 border-emerald-500/40 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                            </div>
                        </div>
                    </div>

                    {/* Notes preview */}
                    <div className="space-y-2">
                        <MockNote tone="primary" pinned title="ÖDEME ALINACAK 4000TL — 406" sub="Sema Döner · 2 saat önce" critical />
                        <MockNote tone="default" title="KBS kontrolü tamamlandı" sub="Ahmet Yılmaz · 35 dk önce" />
                        <MockNote tone="default" title="LAUNDRY 800TL — kadın çıkış 504" sub="Sinan Olyvnik · 6 saat önce" />
                    </div>
                </div>
            </div>

            {/* Glow accent */}
            <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent" />
        </div>
    )
}

function MockNote({ title, sub, pinned, critical }: { title: string; sub: string; tone?: 'primary' | 'default'; pinned?: boolean; critical?: boolean }) {
    return (
        <div className={`p-2.5 rounded-md border ${pinned ? 'border-l-2 border-l-primary border-y-white/10 border-r-white/10 bg-primary/5' : 'border-white/10 bg-white/[0.02]'} text-left`}>
            <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 h-4 px-1.5 rounded text-[9px] font-medium uppercase tracking-wide border border-white/10 bg-white/5 text-zinc-300">
                    <span className="w-1 h-1 rounded-full bg-indigo-400" /> Devir Teslim
                </span>
                {critical && (
                    <span className="inline-flex items-center gap-1 h-4 px-1.5 rounded text-[9px] font-medium uppercase tracking-wide border border-rose-500/20 bg-rose-500/10 text-rose-400">
                        <span className="w-1 h-1 rounded-full bg-rose-500" /> Kritik
                    </span>
                )}
                <span className="inline-flex items-center gap-1 h-4 px-1.5 rounded text-[9px] font-medium uppercase border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">Aktif</span>
            </div>
            <p className="text-xs text-white truncate">{title}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// STATS
// ────────────────────────────────────────────────────────────────────────────

function StatsSection({ t }: { t: any }) {
    const stats = [
        { value: '<3', label: t('landing.stats.shifts.label'), desc: t('landing.stats.shifts.desc') },
        { value: '99.9', label: t('landing.stats.uptime.label'), desc: t('landing.stats.uptime.desc') },
        { value: '2', label: t('landing.stats.languages.label'), desc: t('landing.stats.languages.desc') },
        { value: '4', label: t('landing.stats.devices.label'), desc: t('landing.stats.devices.desc') },
    ]

    return (
        <section className="relative py-16 border-y border-white/5 bg-zinc-950/40">
            <div className="container mx-auto px-6">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={STAGGER}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
                >
                    {stats.map((stat, i) => (
                        <motion.div key={i} variants={FADE_UP} className="text-center">
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                <span className="text-3xl md:text-4xl font-bold text-white tracking-tight tabular-nums">{stat.value}</span>
                                <span className="text-sm text-zinc-500 font-medium">{stat.label}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{stat.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FEATURE GRID (compact)
// ────────────────────────────────────────────────────────────────────────────

function FeatureGrid({ t }: { t: any }) {
    const features = [
        { icon: Smartphone, color: 'text-blue-400', title: t('landing.feature.mobile.title'), desc: t('landing.feature.mobile.desc') },
        { icon: Shield, color: 'text-emerald-400', title: t('landing.feature.security.title'), desc: t('landing.feature.security.desc') },
        { icon: Globe, color: 'text-purple-400', title: t('landing.feature.sync.title'), desc: t('landing.feature.sync.desc') },
        { icon: MessageSquare, color: 'text-pink-400', title: t('landing.feature.messaging.title'), desc: t('landing.feature.messaging.desc') },
        { icon: Clock, color: 'text-orange-400', title: t('landing.feature.handovers.title'), desc: t('landing.feature.handovers.desc') },
        { icon: Users, color: 'text-cyan-400', title: t('landing.feature.roster.title'), desc: t('landing.feature.roster.desc') },
        { icon: BarChart3, color: 'text-indigo-400', title: t('landing.feature.analytics.title'), desc: t('landing.feature.analytics.desc') },
        { icon: Lock, color: 'text-red-400', title: t('landing.feature.vault.title'), desc: t('landing.feature.vault.desc') },
        { icon: Zap, color: 'text-yellow-400', title: t('landing.feature.tasks.title'), desc: t('landing.feature.tasks.desc') },
    ]

    return (
        <section id="features" className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">
                <motion.header
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={FADE_UP}
                    className="text-center mb-12 max-w-2xl mx-auto"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">{t('landing.features.title')}</h2>
                    <p className="text-zinc-400">{t('landing.features.subtitle')}</p>
                </motion.header>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={STAGGER}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
                >
                    {features.map((f, i) => {
                        const Icon = f.icon
                        return (
                            <motion.div
                                key={i}
                                variants={FADE_UP}
                                className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors group"
                            >
                                <div className="mb-4 p-2.5 rounded-lg bg-zinc-900 w-fit border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                    <Icon className={`w-5 h-5 ${f.color}`} aria-hidden="true" />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">{f.desc}</p>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// DEEP-DIVE (alternating image+text sections)
// ────────────────────────────────────────────────────────────────────────────

function DeepDive({ t }: { t: any }) {
    const sections = [
        {
            tag: t('landing.deepdive.section1.tag'),
            title: t('landing.deepdive.section1.title'),
            desc: t('landing.deepdive.section1.desc'),
            bullets: [
                t('landing.deepdive.section1.bullet1'),
                t('landing.deepdive.section1.bullet2'),
                t('landing.deepdive.section1.bullet3'),
            ],
            visual: <HandoverVisual />
        },
        {
            tag: t('landing.deepdive.section2.tag'),
            title: t('landing.deepdive.section2.title'),
            desc: t('landing.deepdive.section2.desc'),
            bullets: [
                t('landing.deepdive.section2.bullet1'),
                t('landing.deepdive.section2.bullet2'),
                t('landing.deepdive.section2.bullet3'),
            ],
            visual: <ComplianceVisual />
        },
        {
            tag: t('landing.deepdive.section3.tag'),
            title: t('landing.deepdive.section3.title'),
            desc: t('landing.deepdive.section3.desc'),
            bullets: [
                t('landing.deepdive.section3.bullet1'),
                t('landing.deepdive.section3.bullet2'),
                t('landing.deepdive.section3.bullet3'),
            ],
            visual: <OperationsVisual />
        },
    ]

    return (
        <section className="py-24 border-t border-white/5">
            <div className="container mx-auto px-6 space-y-24 max-w-6xl">
                {sections.map((s, i) => (
                    <motion.div
                        key={i}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={STAGGER}
                        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-last' : ''}`}
                    >
                        <motion.div variants={FADE_UP}>
                            <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                                {s.tag}
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
                                {s.title}
                            </h3>
                            <p className="text-zinc-400 text-base leading-relaxed mb-6">
                                {s.desc}
                            </p>
                            <ul className="space-y-2.5">
                                {s.bullets.map((b, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div variants={FADE_UP}>
                            {s.visual}
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

function HandoverVisual() {
    return (
        <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">14:00 Vardiya</div>
                <div className="space-y-1.5 flex-1">
                    {[
                        { label: 'Kasa devri', value: '₺ 4.250 → 4.250', good: true },
                        { label: 'Açık olaylar', value: '5 aktif', good: false },
                        { label: 'Bekleyen ödeme', value: '₺ 4.000', good: false },
                        { label: 'KBS kontrol', value: '✓', good: true },
                    ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md bg-white/[0.03] border border-white/5">
                            <span className="text-xs text-zinc-400">{row.label}</span>
                            <span className={`text-xs font-mono font-semibold ${row.good ? 'text-emerald-400' : 'text-amber-400'}`}>{row.value}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="text-[10px] text-zinc-400">AI özet hazırlanıyor…</span>
                </div>
            </div>
        </div>
    )
}

function ComplianceVisual() {
    return (
        <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden p-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
            <div className="relative flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                    <svg className="w-32 h-32 -rotate-90">
                        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                        <motion.circle
                            cx="64" cy="64" r="54"
                            stroke="currentColor" strokeWidth="6" fill="transparent" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 54}
                            initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                            whileInView={{ strokeDashoffset: (2 * Math.PI * 54) * 0.5 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            viewport={{ once: true }}
                            className="text-emerald-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white tabular-nums">1/2</span>
                    </div>
                </div>
                <div className="space-y-1.5 w-full max-w-[220px]">
                    <div className="flex items-center justify-between p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-xs text-zinc-300">KBS</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-rose-500/5 border border-rose-500/20">
                        <span className="text-xs text-zinc-300">Acente Mesajları</span>
                        <X className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function OperationsVisual() {
    const cells = [
        ['A', 'A', 'B', 'OFF', 'C', 'C', 'OFF'],
        ['B', 'B', 'OFF', 'A', 'A', 'A', 'A'],
        ['OFF', 'C', 'C', 'B', 'B', 'OFF', 'A'],
        ['C', 'A', 'A', 'A', 'OFF', 'B', 'B'],
    ]
    const colors: Record<string, string> = {
        A: 'bg-indigo-500/80 text-white',
        B: 'bg-purple-500/80 text-white',
        C: 'bg-rose-500/80 text-white',
        OFF: 'bg-zinc-800 text-zinc-500',
    }

    return (
        <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col">
                <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'].map(d => (
                        <div key={d} className="text-center">{d}</div>
                    ))}
                </div>
                <div className="space-y-1.5 flex-1">
                    {cells.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-7 gap-1">
                            {row.map((c, ci) => (
                                <div key={ci} className={`h-7 rounded flex items-center justify-center text-[10px] font-bold ${colors[c]}`}>
                                    {c}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// COMPARISON
// ────────────────────────────────────────────────────────────────────────────

function ComparisonSection({ t }: { t: any }) {
    return (
        <section className="py-24 border-t border-white/5 bg-zinc-950">
            <div className="container mx-auto px-6 max-w-5xl">
                <motion.header
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={FADE_UP}
                    className="text-center mb-12 max-w-2xl mx-auto"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">{t('landing.compare.title')}</h2>
                    <p className="text-zinc-400">{t('landing.compare.subtitle')}</p>
                </motion.header>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={STAGGER}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {/* Before */}
                    <motion.div variants={FADE_UP} className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                            {t('landing.compare.before.title')}
                        </h3>
                        <ul className="space-y-3">
                            {[
                                t('landing.compare.before.item1'),
                                t('landing.compare.before.item2'),
                                t('landing.compare.before.item3'),
                                t('landing.compare.before.item4'),
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                                    <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* After */}
                    <motion.div variants={FADE_UP} className="p-6 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/15 rounded-full blur-2xl" aria-hidden="true" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 relative">
                            {t('landing.compare.after.title')}
                        </h3>
                        <ul className="space-y-3 relative">
                            {[
                                t('landing.compare.after.item1'),
                                t('landing.compare.after.item2'),
                                t('landing.compare.after.item3'),
                                t('landing.compare.after.item4'),
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-white">
                                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FAQ
// ────────────────────────────────────────────────────────────────────────────

function FaqSection({ t }: { t: any }) {
    const faqs = [
        { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
        { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
        { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
        { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
        { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
    ]

    return (
        <section className="py-24 border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
                <motion.header
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={FADE_UP}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">{t('landing.faq.title')}</h2>
                    <p className="text-zinc-400">{t('landing.faq.subtitle')}</p>
                </motion.header>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={STAGGER}
                    className="space-y-2"
                >
                    {faqs.map((f, i) => (
                        <FaqItem key={i} q={f.q} a={f.a} />
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false)
    return (
        <motion.div variants={FADE_UP} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/50 transition-colors"
                aria-expanded={open}
            >
                <span className="text-sm md:text-base font-medium text-white pr-4">{q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
            </motion.div>
        </motion.div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FINAL CTA
// ────────────────────────────────────────────────────────────────────────────

function FinalCta({ t, navigate }: { t: any; navigate: any }) {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/30 via-purple-500/15 to-transparent blur-3xl" />
            </div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                variants={FADE_UP}
                className="container mx-auto px-6 text-center max-w-3xl"
            >
                <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 backdrop-blur-sm">
                    <Bot className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    {t('landing.pricing.title')}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                    {t('landing.finalCta.title')}
                </h2>
                <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
                    {t('landing.finalCta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        size="lg"
                        onClick={() => navigate('/pricing')}
                        className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-full active:scale-[0.98] transition-transform group"
                    >
                        {t('landing.hero.cta.primary')}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/live-demo')}
                        className="h-12 px-6 border-white/15 text-white hover:bg-white/5 rounded-full active:scale-[0.98] transition-transform"
                    >
                        <Play className="w-4 h-4 mr-1" aria-hidden="true" />
                        {t('landing.hero.cta.secondary')}
                    </Button>
                </div>
            </motion.div>
        </section>
    )
}
