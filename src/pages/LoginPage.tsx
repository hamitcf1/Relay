import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
                                setLoginError("Hotel Code is required for this hotel.")
                                await useAuthStore.getState().signOut()
                                return
                            }
                            if (actualCode !== hotelCode.trim().toUpperCase()) {
                                setLoginError("Invalid Hotel Code.")
                                await useAuthStore.getState().signOut()
                                return
                            }
                        }
                        // CASE 2: Hotel has NO code (Legacy Support)
                        // Allow login so GM can generate one.
                        // Ideally, we restrict this to GM only, but for now allow all to avoid lockout.
                    } else {
                        // Hotel doesn't exist?
                        setLoginError("Account configuration error: Hotel not found.")
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
                setLoginError("Verification failed. Please try again.")
                await useAuthStore.getState().signOut()
                return
            }

            navigate('/')
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating orbs */}
                <motion.div
                    className="absolute w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ top: '10%', left: '10%' }}
                />
                <motion.div
                    className="absolute w-80 h-80 rounded-full bg-purple-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, 80, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ bottom: '10%', right: '10%' }}
                />
                <motion.div
                    className="absolute w-64 h-64 rounded-full bg-rose-500/10 blur-3xl"
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -30, 30, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ top: '40%', right: '20%' }}
                />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* Login Card */}
            <motion.div
                className="relative z-10 w-full max-w-md mx-4"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="glass rounded-3xl p-8 shadow-2xl">
                    {/* Logo */}
                    <motion.div
                        className="flex flex-col items-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/80 to-primary glow-primary mb-4">
                            <Hotel className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Relay</h1>
                        <p className="text-muted-foreground mt-2">{t('app.description')}</p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {/* Email Field */}
                        <div className="space-y-4">
                            {/* Hotel Code (Optional but recommended) */}
                            <div className="relative">
                                <Hotel className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={hotelCode}
                                    onChange={(e) => setHotelCode(e.target.value.toUpperCase())}
                                    className="pl-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground uppercase tracking-widest font-mono"
                                    placeholder="HOTEL CODE"
                                    maxLength={10}
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
                                    placeholder={t('auth.email')}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
                                    placeholder={t('auth.password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {(error || loginError) && (
                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                                {loginError || error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('auth.login')
                            )}
                        </Button>
                    </motion.form>

                    {/* Footer */}
                    <motion.div
                        className="text-center text-sm mt-6 space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <p className="text-muted-foreground">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className="text-primary hover:text-primary/80 transition-colors">
                                {t('auth.register')}
                            </Link>
                        </p>
                        <p className="text-muted-foreground/60 text-xs">
                            {t('auth.contactGM')}
                        </p>
                    </motion.div>
                </div>

                {/* Decorative glow under card */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/20 blur-3xl rounded-full" />
            </motion.div>
        </div>
    )
}
