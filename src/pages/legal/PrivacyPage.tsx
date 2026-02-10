import { motion } from 'framer-motion'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden">
            <CustomCursor />

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 py-12 relative z-10 max-w-3xl">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-zinc-500 mb-12">Last updated: February 11, 2026</p>

                    <div className="space-y-8 text-zinc-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                            <p className="mb-4">
                                We collect information you provide directly to us, such as when you create an account, update your profile, or use our communication features. This includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                                <li>Account information (name, email, hotel affiliation)</li>
                                <li>Operational data (shift logs, messages, task status)</li>
                                <li>Usage data (login times, feature interaction)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Information</h2>
                            <p>
                                We use the information we collect to operate, maintain, and improve our services, such as:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-zinc-400 mt-4">
                                <li>Facilitating shift handovers and staff communication</li>
                                <li>Providing analytics to hotel management</li>
                                <li>Sending technical notices and security alerts</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
                            <p>
                                We use "Military-Grade" encryption for sensitive data, including hotel access codes and financial logs. Access to data is strictly role-based and logged.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Contact Us</h2>
                            <p>
                                If you have questions about this Privacy Policy, please contact us at: <a href="mailto:hamitfindik2@gmail.com" className="text-primary hover:underline">hamitfindik2@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
