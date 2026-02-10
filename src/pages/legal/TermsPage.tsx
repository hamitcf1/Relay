import { motion } from 'framer-motion'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 cursor-none relative overflow-hidden">
            <CustomCursor />

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-500/5 to-transparent" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-zinc-500 mb-12">Last updated: February 11, 2026</p>

                    <div className="space-y-8 text-zinc-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using Relay, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
                            <p>
                                Relay grants you a limited, non-exclusive, non-transferable, revocable license to use the Service for your internal business operations (hotel management).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
                            <p>
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Availability</h2>
                            <p>
                                While we strive for 99.9% uptime, we do not guarantee that the service will be uninterrupted or error-free. We reserve the right to modify or discontinue the service at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Contact</h2>
                            <p>
                                Questions? Email us at <a href="mailto:hamitfindik2@gmail.com" className="text-blue-400 hover:underline">hamitfindik2@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
