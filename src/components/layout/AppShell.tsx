import { motion } from 'framer-motion'
import { Hotel, Menu, User, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NotificationDropdown } from '../notifications/NotificationDropdown'

interface AppShellProps {
    children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 glow-primary">
                                <Hotel className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient-primary">
                                Relay
                            </span>
                        </motion.div>

                        {/* Compliance Pulse Placeholder */}


                        {/* Navigation Icons */}
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Link to="/operations" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                                <LayoutGrid className="w-5 h-5" />
                            </Link>
                            <NotificationDropdown />
                            <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                                <User className="w-5 h-5 text-zinc-400" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors md:hidden">
                                <Menu className="w-5 h-5 text-zinc-400" />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children || (
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h1 className="text-4xl font-bold mb-4 text-gradient-primary">
                            Welcome to Relay
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                            Your digital handover system for seamless hotel operations.
                            Manage shifts, track logs, and ensure compliance—all in one place.
                        </p>

                        {/* Quick Stats Preview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            {[
                                { label: 'Active Shift', value: '—', color: 'indigo' },
                                { label: 'Open Tickets', value: '0', color: 'amber' },
                                { label: 'Cash Balance', value: '—', color: 'emerald' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    className="glass p-6 rounded-2xl glass-hover"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                                >
                                    <div className="text-zinc-400 text-sm mb-1">{stat.label}</div>
                                    <div className={`text-3xl font-bold text-${stat.color}-400`}>
                                        {stat.value}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-zinc-600 text-sm">
                Relay Hotel Operations System • {new Date().getFullYear()}
            </footer>
        </div>
    )
}
