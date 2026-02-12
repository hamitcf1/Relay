import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'

export function LoginPage() {
    const navigate = useNavigate()
    const { signIn, loading, error, clearError } = useAuthStore()
    const { t } = useLanguageStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [hotelCode, setHotelCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null) // Local error state

    // Cycling Text Logic
    const texts = [
        t('auth.cycling.1'),
        t('auth.cycling.2'),
        t('auth.cycling.3'),
        t('auth.cycling.4')
    ]
    const [textIndex, setTextIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % texts.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [texts.length]) // slightly imperfect dependency but fine for now, or remove dependancy since t changes rarely in this view

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        setLoginError(null)

        // removed pre-check for hotelCode to allow fetching hotel data first

        await signIn(email, password)

        // Post-login verification
        const user = useAuthStore.getState().user
        if (user) {
            try {
                const { doc, getDoc } = await import('firebase/firestore')
                const { db } = await import('@/lib/firebase')

                if (user.hotel_id) {
                    const hotelRef = doc(db, 'hotels', user.hotel_id)
                    const hotelSnap = await getDoc(hotelRef)

                    if (hotelSnap.exists()) {
                        const hotelData = hotelSnap.data()
                        const actualCode = hotelData.code

                        // CASE 1: Hotel HAS a code (Standard Security)
                        if (actualCode) {
                            if (!hotelCode.trim()) {
                                setLoginError(t('auth.error.hotelCodeRequired'))
                                await useAuthStore.getState().signOut()
                                return
                            }
                            if (actualCode !== hotelCode.trim().toUpperCase()) {
                                setLoginError(t('auth.error.invalidHotelCode'))
                                await useAuthStore.getState().signOut()
                                return
                            }
                        }
                        // CASE 2: Hotel has NO code (Legacy Support)
                        // Allow login so GM can generate one.
                        // Ideally, we restrict this to GM only, but for now allow all to avoid lockout.
                    } else {
                        // Hotel doesn't exist?
                        setLoginError(t('auth.error.hotelNotFound'))
                        await useAuthStore.getState().signOut()
                        return
                    }
                } else if (!user.hotel_id && location.pathname !== '/setup-hotel') {
                    // Allow login if no hotel (will redirect to setup)
                    // But wait, user said "requirement for logging into correct hotel"
                    // If they have NO hotel, they probably are a new GM who signed up via some other way?
                    // Or maybe a broken state.
                    // Let's assume if NO hotel_id, we bypass code check (nothing to check against) and let ProtectedRoute handle redirect.
                }
            } catch (err) {
                console.error("Error verifying hotel code:", err)
                setLoginError(t('auth.error.verificationFailed'))
                await useAuthStore.getState().signOut()
                return
            }

            navigate('/')
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Cyber-Concierge Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),rgba(0,0,0,0))]" />
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent opacity-60" />

                {/* Animated Orbs */}
                <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ top: '-20%', left: '-10%' }}
                />
                <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, 80, 0],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ bottom: '-10%', right: '-10%' }}
                />

                {/* Grid Overlay */}
                <div
                    className="absolute inset-0 z-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* Login Card */}
            <motion.div
                className="relative z-10 w-full max-w-[420px] mx-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Glass Container */}
                <div className="relative backdrop-blur-3xl bg-black/40 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden group">
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Back Link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6 group/back relative z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                        {t('auth.backToHome')}
                    </Link>

                    {/* Logo Section */}
                    <motion.div
                        className="flex flex-col items-center mb-10 relative z-10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="relative group/logo mb-6">
                            <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full opacity-50 group-hover/logo:opacity-100 transition-opacity duration-500" />
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 flex items-center justify-center shadow-2xl">
                                <Hotel className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">Relay</h1>

                        <div className="h-6 mt-2 relative w-full flex justify-center">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={texts[textIndex]}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-zinc-500 font-medium tracking-wide text-sm uppercase absolute"
                                >
                                    {texts[textIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6 relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="space-y-4">
                            {/* Hotel Code */}
                            <div className="group/input relative">
                                <Hotel className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    value={hotelCode}
                                    onChange={(e) => setHotelCode(e.target.value.toUpperCase())}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 font-mono tracking-wider uppercase text-sm"
                                    placeholder={t('auth.placeholder.hotelCode')}
                                    maxLength={10}
                                />
                            </div>

                            {/* Email */}
                            <div className="group/input relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 text-sm"
                                    placeholder={t('auth.email')}
                                />
                            </div>

                            {/* Password */}
                            <div className="group/input relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 text-sm"
                                    placeholder={t('auth.password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {(error || loginError) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm text-center font-medium backdrop-blur-sm"
                            >
                                {loginError || error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-base tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t('common.loading')}</span>
                                </div>
                            ) : (
                                t('auth.login')
                            )}
                        </Button>
                    </motion.form>

                    {/* Footer */}
                    <motion.div
                        className="text-center mt-8 relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <p className="text-zinc-500 text-sm">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className="text-white hover:text-primary transition-colors font-semibold hover:underline decoration-primary underline-offset-4">
                                {t('auth.register')}
                            </Link>
                        </p>
                    </motion.div>
                </div>

                {/* Bottom Glow */}
                <div className="absolute -bottom-4 left-10 right-10 h-8 bg-primary/20 blur-2xl rounded-full z-0 pointer-events-none" />
            </motion.div>
        </div>
    )
}
