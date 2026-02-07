import { motion } from 'framer-motion'
import { Hotel, Menu, User } from 'lucide-react'
import { NotificationDropdown } from '../notifications/NotificationDropdown'
import { useLanguageStore } from '@/stores/languageStore'

interface AppShellProps {
    children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const { t } = useLanguageStore()
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="p-2 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Hotel className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xl font-bold text-foreground">
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
                            <NotificationDropdown />
                            <button className="p-2 rounded-lg hover:bg-accent transition-colors" title={t('dashboard.userProfile')}>
                                <User className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-accent transition-colors md:hidden">
                                <Menu className="w-5 h-5 text-muted-foreground" />
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
                            {t('app.welcome')}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            {t('app.description')}
                        </p>

                        {/* Quick Stats Preview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            {[
                                { key: 'app.activeShift', value: '—', color: 'indigo' },
                                { key: 'app.openTickets', value: '0', color: 'amber' },
                                { key: 'app.cashBalance', value: '—', color: 'emerald' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.key}
                                    className="glass p-6 rounded-2xl glass-hover"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                                >
                                    <div className="text-muted-foreground text-sm mb-1">{t(stat.key as any)}</div>
                                    <div className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                        {stat.value}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-muted-foreground text-sm">
                {t('app.systemTitle')} • {new Date().getFullYear()}
            </footer>
        </div>
    )
}
