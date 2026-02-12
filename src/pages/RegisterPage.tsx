import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2, User, ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { useHotelStore } from '@/stores/hotelStore'
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
    const [hotelCode, setHotelCode] = useState('')
    const [isGM, setIsGM] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Helper to validate code
    const { validateHotelCode } = useHotelStore()

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

        // Hotel Code Validation for non-GMs
        let validatedHotelId: string | null = null
        if (!isGM) {
            if (!hotelCode.trim()) {
                setError(t('auth.error.joinHotelCode'))
                return
            }
            setLoading(true)
            validatedHotelId = await validateHotelCode(hotelCode.trim().toUpperCase())
            if (!validatedHotelId) {
                setLoading(false)
                setError(t('auth.error.invalidJoinCode'))
                return
            }
        }

        setLoading(true)

        try {
            // Create Firebase Auth user
            const credential = await createUserWithEmailAndPassword(auth, email, password)

            // Create user document in Firestore
            await setDoc(doc(db, 'users', credential.user.uid), {
                email: email,
                name: name.trim(),
                role: isGM ? 'gm' : role,
                current_shift_type: null,
                hotel_id: validatedHotelId, // Will be null for GMs, valid ID for staff
                created_at: new Date(),
            })

            // Update hotel staff list if joining
            if (validatedHotelId) {
                const { updateDoc, arrayUnion, doc: firestoreDoc } = await import('firebase/firestore')
                await updateDoc(firestoreDoc(db, 'hotels', validatedHotelId), {
                    staff_list: arrayUnion(credential.user.uid)
                })
            }

            // Navigate based on role
            if (isGM) {
                navigate('/setup-hotel')
            } else {
                navigate('/')
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('auth.error.regFailed')
            setError(errorMessage.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
            setLoading(false)
        }
    }

    const roles: { value: UserRole; label: string; desc: string }[] = [
        { value: 'receptionist', label: t('auth.role.receptionist'), desc: t('auth.role.receptionistDesc') },
        { value: 'housekeeping', label: t('auth.role.housekeeping'), desc: t('auth.role.housekeepingDesc') },
    ]

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans selection:bg-primary/30 py-10 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
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

            {/* Register Card */}
            <motion.div
                className="relative z-10 w-full max-w-[480px] mx-4"
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
                        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8 group/back relative z-10"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                        {t('auth.backToHome')}
                    </Link>

                    {/* Header */}
                    <motion.div
                        className="mb-8 relative z-10"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{t('auth.register')}</h1>
                        <p className="text-zinc-400">{t('auth.registerSubtitle')}</p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {/* Role Selection & GM Toggle */}
                        <div className="space-y-3">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider pl-1">{t('auth.role.selection')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsGM(false)}
                                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group/btn ${!isGM
                                        ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]'
                                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity duration-500 ${!isGM ? 'opacity-100' : ''}`} />
                                    <div className="relative z-10">
                                        <div className="font-bold text-sm mb-1">{t('auth.role.staff')}</div>
                                        <div className="text-[11px] opacity-70">{t('auth.role.staffDesc')}</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsGM(true)}
                                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group/btn ${isGM
                                        ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]'
                                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity duration-500 ${isGM ? 'opacity-100' : ''}`} />
                                    <div className="relative z-10">
                                        <div className="font-bold text-sm mb-1">{t('auth.role.manager')}</div>
                                        <div className="text-[11px] opacity-70">{t('auth.role.managerDesc')}</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Hotel Code (Only for Staff) */}
                        {!isGM && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <div className="group/input relative">
                                    <Hotel className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                    <input
                                        value={hotelCode}
                                        onChange={(e) => setHotelCode(e.target.value.toUpperCase())}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 font-mono tracking-wider uppercase text-sm"
                                        placeholder={t('auth.placeholder.hotelCode')}
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-zinc-500 pl-1">
                                    {t('auth.helper.askManager')}
                                </p>
                            </motion.div>
                        )}

                        {/* Standard Fields */}
                        <div className="space-y-4">
                            <div className="group/input relative">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 text-sm"
                                    placeholder={t('auth.name')}
                                    required
                                />
                            </div>

                            <div className="group/input relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 text-sm"
                                    placeholder={t('auth.email')}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="group/input relative">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-10 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 text-sm"
                                        placeholder={t('auth.password')}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="group/input relative">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 text-sm"
                                        placeholder={t('auth.confirmPassword')}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Staff Role Selection (Only if not GM) */}
                        {!isGM && (
                            <div className="grid grid-cols-2 gap-3">
                                {roles.map((r) => (
                                    <div
                                        key={r.value}
                                        onClick={() => setRole(r.value)}
                                        className={`cursor-pointer p-3 rounded-xl border transition-all duration-300 ${role === r.value
                                            ? 'bg-white/10 border-white/30'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-bold ${role === r.value ? 'text-white' : 'text-zinc-400'}`}>
                                                {r.label}
                                            </span>
                                            {role === r.value && (
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 leading-tight">
                                            {r.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <motion.div
                                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm text-center font-medium backdrop-blur-sm"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-base tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t('auth.creatingAccount')}</span>
                                </div>
                            ) : (
                                t('auth.createAccount')
                            )}
                        </Button>
                    </form>
                    {/* Footer */}
                    <motion.div
                        className="text-center mt-8 relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <p className="text-zinc-500 text-sm">
                            {t('auth.haveAccount')}{' '}
                            <Link to="/login" className="text-white hover:text-primary transition-colors font-semibold hover:underline decoration-primary underline-offset-4">
                                {t('auth.login')}
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
