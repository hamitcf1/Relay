import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { PasswordReveal } from '@/components/ui/PasswordReveal'
import { RelayMark } from '@/components/brand/RelayBrand'

export function LoginPage() {
    const navigate = useNavigate()
    const { signIn, loading, error, clearError } = useAuthStore()
    const { t } = useLanguageStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [hotelCode, setHotelCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        setLoginError(null)

        await signIn(email, password)

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
                    } else {
                        setLoginError(t('auth.error.hotelNotFound'))
                        await useAuthStore.getState().signOut()
                        return
                    }
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
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-10 font-sans selection:bg-primary/30">
            <motion.div
                className="relative w-full max-w-[400px]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    {t('auth.backToHome')}
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <RelayMark className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none">Aetherius Relay</h1>
                        <p className="text-xs text-zinc-400 mt-1">{t('auth.login')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <label htmlFor="hotelCode" className="sr-only">{t('auth.placeholder.hotelCode')}</label>
                        <Hotel className="absolute left-3 top-3 w-4 h-4 text-zinc-500" aria-hidden="true" />
                        <input
                            id="hotelCode"
                            name="hotelCode"
                            autoComplete="organization"
                            value={hotelCode}
                            onChange={(e) => setHotelCode(e.target.value.toUpperCase())}
                            className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors font-mono tracking-wide uppercase text-sm"
                            placeholder={t('auth.placeholder.hotelCode')}
                            maxLength={10}
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="email" className="sr-only">{t('auth.email')}</label>
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" aria-hidden="true" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors text-sm"
                            placeholder={t('auth.email')}
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="password" className="sr-only">{t('auth.password')}</label>
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" aria-hidden="true" />
                        <div className="absolute left-9 right-10 top-0 bottom-0 pointer-events-none flex items-center text-sm font-mono tracking-tight overflow-hidden select-none">
                            <PasswordReveal value={password} visible={showPassword} />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-10 hide-password-text caret-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors text-sm font-mono tracking-tight"
                            placeholder={t('auth.password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                        </button>
                    </div>

                    {(error || loginError) && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                            {loginError || error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-10 mt-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t('common.loading')}</span>
                            </>
                        ) : (
                            t('auth.login')
                        )}
                    </Button>
                </form>

                <p className="text-center mt-8 text-zinc-500 text-sm">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="text-white hover:text-primary transition-colors font-medium">
                        {t('auth.register')}
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
