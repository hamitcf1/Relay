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
import { PasswordReveal } from '@/components/ui/PasswordReveal'
import { cleanAuthError } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import { RelayMark } from '@/components/brand/RelayBrand'

export function RegisterPage() {
    const navigate = useNavigate()
    const { t } = useLanguageStore()
    const { validateHotelCode } = useHotelStore()

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

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

        if (!isGM && !hotelCode.trim()) {
            setError(t('auth.error.joinHotelCode'))
            return
        }

        setLoading(true)

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password)

            let validatedHotelId: string | null = null
            
            // Validate hotel code AFTER user is created so Firestore rules allow reading hotels collection
            if (!isGM) {
                validatedHotelId = await validateHotelCode(hotelCode.trim().toUpperCase())
                if (!validatedHotelId) {
                    await credential.user.delete()
                    auth.signOut()
                    setLoading(false)
                    setError(t('auth.error.invalidJoinCode'))
                    return
                }
            }

            await setDoc(doc(db, 'users', credential.user.uid), {
                email: email,
                name: name.trim(),
                role: isGM ? 'gm' : role,
                current_shift_type: null,
                hotel_id: validatedHotelId,
                created_at: new Date(),
            })

            if (validatedHotelId) {
                const { updateDoc, arrayUnion, doc: firestoreDoc } = await import('firebase/firestore')
                await updateDoc(firestoreDoc(db, 'hotels', validatedHotelId), {
                    staff_list: arrayUnion(credential.user.uid)
                })
            }

            navigate(isGM ? '/setup-hotel' : '/')
        } catch (err: any) {
            setError(cleanAuthError(err, t))
            setLoading(false)
        }
    }

    const roles: { value: UserRole; label: string; desc: string }[] = [
        { value: 'receptionist', label: t('auth.role.receptionist'), desc: t('auth.role.receptionistDesc') },
        { value: 'housekeeping', label: t('auth.role.housekeeping'), desc: t('auth.role.housekeepingDesc') },
    ]

    return (
        <div className="auth-shell flex items-center justify-center px-4 py-10 font-sans text-foreground selection:bg-primary/30">
            <motion.div
                className="auth-panel relative w-full max-w-[480px]"
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

                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <RelayMark className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none">{t('auth.createAccount')}</h1>
                        <p className="text-xs text-zinc-400 mt-1">{t('auth.registerSubtitle')}</p>
                    </div>
                </div>

                {/* Role Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setIsGM(false)}
                        className={cn(
                            "p-3 rounded-lg border text-left transition-colors active:scale-[0.98]",
                            !isGM ? "border-primary/60 bg-primary/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        )}
                    >
                        <div className="text-sm font-semibold">{t('auth.role.staff')}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{t('auth.role.staffDesc')}</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsGM(true)}
                        className={cn(
                            "p-3 rounded-lg border text-left transition-colors active:scale-[0.98]",
                            isGM ? "border-primary/60 bg-primary/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        )}
                    >
                        <div className="text-sm font-semibold">{t('auth.role.manager')}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{t('auth.role.managerDesc')}</div>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {!isGM && (
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
                            <p className="text-[11px] text-zinc-500 mt-1.5 pl-1">{t('auth.helper.askManager')}</p>
                        </div>
                    )}

                    <div className="relative">
                        <label htmlFor="name" className="sr-only">{t('auth.name')}</label>
                        <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" aria-hidden="true" />
                        <input
                            id="name"
                            name="name"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors text-sm"
                            placeholder={t('auth.name')}
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
                            autoComplete="new-password"
                            required
                            minLength={6}
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

                    <div className="relative">
                        <label htmlFor="confirmPassword" className="sr-only">{t('auth.confirmPassword')}</label>
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" aria-hidden="true" />
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors text-sm font-mono tracking-tight"
                            placeholder={t('auth.confirmPassword')}
                        />
                    </div>

                    {/* Role for staff */}
                    {!isGM && (
                        <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-medium text-zinc-400 px-1">{t('auth.roleLabel')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={cn(
                                            "p-2.5 rounded-lg border text-left transition-colors active:scale-[0.98]",
                                            role === r.value ? "border-primary/60 bg-primary/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="text-xs font-semibold">{r.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                            {error}
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
                                <span>{t('auth.creatingAccount')}</span>
                            </>
                        ) : (
                            t('auth.createAccount')
                        )}
                    </Button>
                </form>

                <p className="text-center mt-8 text-zinc-500 text-sm">
                    {t('auth.haveAccount')}{' '}
                    <Link to="/login" className="text-white hover:text-primary transition-colors font-medium">
                        {t('auth.login')}
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
