import { motion } from 'framer-motion'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'

export function StatusPage() {
    const systems = [
        { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
        { name: 'Database Clusters', status: 'operational', uptime: '99.98%' },
        { name: 'Real-time Messaging', status: 'operational', uptime: '100%' },
        { name: 'Notifications', status: 'operational', uptime: '99.95%' },
        { name: 'Auth Services', status: 'operational', uptime: '100%' },
    ]

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden">
            <CustomCursor />

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-emerald-500/5 to-transparent" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 py-12 relative z-10 max-w-3xl">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-12 p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-col text-center"
                >
                    <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">All Systems Operational</h1>
                    <p className="text-emerald-200/70">Everything is running smoothly.</p>
                </motion.div>

                <div className="space-y-4">
                    {systems.map((sys, i) => (
                        <motion.div
                            key={sys.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="font-medium text-white">{sys.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-zinc-500 hidden sm:block">Uptime {sys.uptime}</span>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                                    Operational
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-500 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Last updated: Just now
                    </p>
                </div>
            </div>
        </div>
    )
}
