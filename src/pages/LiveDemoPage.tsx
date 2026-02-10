import { motion } from 'framer-motion'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Hotel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function LiveDemoPage() {
    const navigate = useNavigate()

    const startDemo = async (role: 'gm' | 'receptionist') => {
        await useAuthStore.getState().loginAsDemo(role)
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden flex flex-col">
            <CustomCursor />

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-[60vh] bg-gradient-to-b from-purple-500/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
            </div>

            <div className="container mx-auto px-6 py-12 flex-1 flex flex-col justify-center relative z-10">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12 absolute top-12 left-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl font-bold text-white mb-6">Interactive Live Demo</h1>
                        <p className="text-xl text-zinc-400">
                            Experience the power of Relay firsthand. Choose a persona to explore the dashboard from different perspectives.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                    {/* GM Persona */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                                <Hotel className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">General Manager</h2>
                            <p className="text-zinc-400 mb-8 flex-1">
                                Full access to all settings, analytics, staff management, and hotel configuration. See the big picture.
                            </p>
                            <Button
                                onClick={() => startDemo('gm')}
                                className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-lg"
                            >
                                Enter as Helper Manager
                            </Button>
                        </div>
                    </motion.div>

                    {/* Staff Persona */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Staff Member</h2>
                            <p className="text-zinc-400 mb-8 flex-1">
                                Focused view for daily operations, shift logs, messaging, and task completion. Streamlined for efficiency.
                            </p>
                            <Button
                                onClick={() => startDemo('receptionist')}
                                className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-lg"
                            >
                                Enter as Receptionist
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
