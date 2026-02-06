import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2, User, ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
                setError("Please enter a Hotel Code to join your team.")
                return
            }
            setLoading(true)
            validatedHotelId = await validateHotelCode(hotelCode.trim().toUpperCase())
            if (!validatedHotelId) {
                setLoading(false)
                setError("Invalid Hotel Code. Please check with your manager.")
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
                        {/* Role Selection & GM Toggle */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">I am a...</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsGM(false)}
                                    className={`p-3 rounded-xl border text-left transition-all ${!isGM ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <div className="font-semibold text-sm mb-1">Staff Member</div>
                                    <div className="text-[10px] opacity-70">Joining a team</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsGM(true)}
                                    className={`p-3 rounded-xl border text-left transition-all ${isGM ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <div className="font-semibold text-sm mb-1">Manager</div>
                                    <div className="text-[10px] opacity-70">Creating a hotel</div>
                                </button>
                            </div>
                        </div>

                        {/* Hotel Code (Only for Staff) */}
                        {!isGM && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Hotel className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={hotelCode}
                                        onChange={(e) => setHotelCode(e.target.value.toUpperCase())}
                                        className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 uppercase tracking-widest font-mono"
                                        placeholder="HOTEL CODE (e.g. RELAY-X)"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-500 ml-1">
                                    Ask your manager for the hotel code.
                                </p>
                            </div>
                        )}

                        {/* Standard Fields */}
                        <div className="space-y-3">
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    placeholder={t('auth.name')}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    placeholder={t('auth.email')}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    placeholder={t('auth.password')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    placeholder={t('auth.confirmPassword')}
                                    required
                                />
                            </div>
                        </div>

                        {/* Staff Role Selection (Only if not GM) */}
                        {!isGM && (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {roles.map((r) => (
                                    <div
                                        key={r.value}
                                        onClick={() => setRole(r.value)}
                                        className={`cursor-pointer p-3 rounded-xl border transition-all ${role === r.value
                                            ? 'bg-zinc-800 border-zinc-700'
                                            : 'bg-black/20 border-zinc-800/50 hover:bg-zinc-900'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-semibold ${role === r.value ? 'text-white' : 'text-zinc-400'}`}>
                                                {r.label}
                                            </span>
                                            {role === r.value && (
                                                <motion.div layoutId="check">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                </motion.div>
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

                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/20 blur-3xl rounded-full" />
                </div>
            </motion.div>
        </div>
    )
}
