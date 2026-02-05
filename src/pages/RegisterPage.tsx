import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2, User, ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguageStore } from '@/stores/languageStore'
import type { UserRole } from '@/types'

export function RegisterPage() {
    const navigate = useNavigate()
    const { t } = useLanguageStore()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState<UserRole>('receptionist')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!name.trim()) {
            setError(t('auth.error.enterName'))
            return
        }

        if (password.length < 6) {
            setError(t('auth.error.passwordLength'))
            return
        }

        if (password !== confirmPassword) {
            setError(t('auth.error.passwordMismatch'))
            return
        }

        setLoading(true)

        try {
            // Create Firebase Auth user
            const credential = await createUserWithEmailAndPassword(auth, email, password)

            // Create user document in Firestore
            await setDoc(doc(db, 'users', credential.user.uid), {
                email: email,
                name: name.trim(),
                role: role,
                current_shift_type: null,
                created_at: new Date(),
            })

            // Navigate to hotel setup
            navigate('/setup-hotel')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('auth.error.regFailed')
            setError(errorMessage.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
        } finally {
            setLoading(false)
        }
    }

    const roles: { value: UserRole; label: string; desc: string }[] = [
        { value: 'receptionist', label: t('auth.role.receptionist'), desc: t('auth.role.receptionistDesc') },
        { value: 'housekeeping', label: t('auth.role.housekeeping'), desc: t('auth.role.housekeepingDesc') },
    ]

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ top: '10%', left: '10%' }}
                />
                <motion.div
                    className="absolute w-80 h-80 rounded-full bg-purple-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ bottom: '10%', right: '10%' }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* Register Card */}
            <motion.div
                className="relative z-10 w-full max-w-md mx-4"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="glass rounded-3xl p-8 shadow-2xl">
                    {/* Back Link */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('common.back')}
                    </Link>

                    {/* Logo */}
                    <motion.div
                        className="flex flex-col items-center mb-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 glow-primary mb-4">
                            <Hotel className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gradient-primary">{t('auth.register')}</h1>
                        <p className="text-zinc-400 mt-1 text-sm">{t('auth.registerSubtitle')}</p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-400 ml-1">{t('auth.name')}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-11"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-400 ml-1">{t('auth.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-11"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-400 ml-1">{t('auth.password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-11 pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-400 ml-1">{t('common.confirm')} {t('auth.password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-11"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">{t('auth.roleLabel')}</label>
                            <div className="grid gap-2">
                                {roles.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={`p-3 rounded-lg border text-left transition-all ${role === r.value
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-zinc-700 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{r.label}</div>
                                        <div className="text-xs text-zinc-500">{r.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('auth.creatingAccount')}
                                </>
                            ) : (
                                t('auth.createAccount')
                            )}
                        </Button>
                    </form>
                </div>

                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/20 blur-3xl rounded-full" />
            </motion.div>
        </div>
    )
}
