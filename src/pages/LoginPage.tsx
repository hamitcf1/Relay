import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, Zap, CheckCircle2, UserCheck, KeyRound } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { PasswordReveal } from '@/components/ui/PasswordReveal'
import { RelayMark } from '@/components/brand/RelayBrand'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserRole } from '@/types'
import { toast } from 'sonner'

interface StaffQuickAccount {
    uid: string
    name: string
    email: string
    password?: string
    role: UserRole
    is_demo?: boolean
}

export function LoginPage() {
    const navigate = useNavigate()
    const { signIn, loginAsDemo, loading, error, clearError } = useAuthStore()
    const { t } = useLanguageStore()

    const [loginMode, setLoginMode] = useState<'quick' | 'email'>('quick')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [hotelCode, setHotelCode] = useState(() => {
        return localStorage.getItem('relay_hotel_code') || ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)

    // Staff accounts fetched for the selected hotel code
    const [staffList, setStaffList] = useState<StaffQuickAccount[]>([])
    const [isFetchingStaff, setIsFetchingStaff] = useState(false)

    // Update localStorage when hotel code changes
    const handleHotelCodeChange = (code: string) => {
        const formatted = code.toUpperCase()
        setHotelCode(formatted)
        if (formatted.trim()) {
            localStorage.setItem('relay_hotel_code', formatted.trim())
        }
    }

    // Auto-fetch staff when hotel code is entered
    useEffect(() => {
        const trimmedCode = hotelCode.trim().toUpperCase()
        if (!trimmedCode) {
            setStaffList([])
            return
        }

        // Demo Hotel Code
        if (trimmedCode === 'DEMO' || trimmedCode === 'DEMO123' || trimmedCode === 'DEMO-HOTEL-ID') {
            setStaffList([
                { uid: 'demo-user-gm', name: 'Demo Manager', email: 'demo.gm@relay.app', role: 'gm', is_demo: true, password: '123456' },
                { uid: 'demo-user-staff', name: 'Demo Staff', email: 'demo.receptionist@relay.app', role: 'receptionist', is_demo: true, password: '123456' }
            ])
            return
        }

        let isMounted = true
        setIsFetchingStaff(true)

        const fetchHotelStaff = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore')
                
                // 1. Find hotel by code
                const hotelsRef = collection(db, 'hotels')
                const hQuery = query(hotelsRef, where('code', '==', trimmedCode))
                let hSnap = await getDocs(hQuery)

                let hotelId: string | null = null

                if (!hSnap.empty) {
                    hotelId = hSnap.docs[0].id
                } else {
                    // Try checking directly by document ID in case hotel code is hotel ID
                    try {
                        const directDocRef = doc(db, 'hotels', trimmedCode)
                        const directDoc = await getDoc(directDocRef)
                        if (directDoc.exists()) {
                            hotelId = directDoc.id
                        }
                    } catch (e) {
                        // ignore direct lookup error
                    }
                }

                if (!hotelId) {
                    if (isMounted) setStaffList([])
                    return
                }

                // 2. Fetch active staff for this hotel
                const usersRef = collection(db, 'users')
                const uQuery = query(usersRef, where('hotel_id', '==', hotelId))
                const uSnap = await getDocs(uQuery)

                const members: StaffQuickAccount[] = []
                uSnap.forEach(docSnap => {
                    const uData = docSnap.data()
                    if (uData.status !== 'inactive' && uData.name) {
                        members.push({
                            uid: docSnap.id,
                            name: uData.name,
                            email: uData.email,
                            password: uData.password,
                            role: (uData.role as UserRole) || 'receptionist'
                        })
                    }
                })

                // Sort: GM first, then alphabetical by name
                members.sort((a, b) => {
                    if (a.role === 'gm' && b.role !== 'gm') return -1
                    if (a.role !== 'gm' && b.role === 'gm') return 1
                    return a.name.localeCompare(b.name)
                })

                if (isMounted) setStaffList(members)
            } catch (err) {
                console.error("Error fetching staff for hotel code:", err)
                if (isMounted) setStaffList([])
            } finally {
                if (isMounted) setIsFetchingStaff(false)
            }
        }

        const timeout = setTimeout(fetchHotelStaff, 300)
        return () => {
            isMounted = false
            clearTimeout(timeout)
        }
    }, [hotelCode])

    // Quick 1-Click Login for Staff
    const handleQuickLogin = async (staff: StaffQuickAccount) => {
        clearError()
        setLoginError(null)

        if (staff.is_demo) {
            await loginAsDemo(staff.role)
            navigate('/dashboard')
            return
        }

        const passToUse = staff.password
        if (!passToUse) {
            // Switch to email mode and prefill email
            setEmail(staff.email)
            toast.info(`${staff.name} hesabı seçildi. Lütfen şifrenizi giriniz.`)
            setLoginMode('email')
            return
        }

        try {
            await signIn(staff.email, passToUse)
            const currentUser = useAuthStore.getState().user
            if (currentUser) {
                navigate('/')
            }
        } catch (err: any) {
            console.error("Quick login error:", err)
            setLoginError("Giriş yapılamadı. Şifreyi kontrol ediniz.")
        }
    }

    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        setLoginError(null)

        await signIn(email, password)

        const user = useAuthStore.getState().user
        if (user) {
            if (user.is_demo || user.hotel_id === 'demo-hotel-id') {
                navigate('/dashboard')
                return
            }
            try {
                const { doc, getDoc } = await import('firebase/firestore')

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
        <div className="auth-shell flex items-center justify-center px-4 py-10 font-sans text-foreground selection:bg-primary/30">
            <motion.div
                className="auth-panel relative w-full max-w-[480px]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    {t('auth.backToHome')}
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <RelayMark className="h-10 w-10 text-primary shrink-0" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Aetherius Relay</h1>
                            <p className="text-xs text-zinc-400 mt-1">Giriş Yap & Vardiya Paneli</p>
                        </div>
                    </div>
                </div>

                {/* LOGIN MODE TABS */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 mb-6">
                    <button
                        type="button"
                        onClick={() => setLoginMode('quick')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            loginMode === 'quick'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5" /> Hızlı Personel Girişi
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMode('email')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            loginMode === 'email'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        <KeyRound className="w-3.5 h-3.5" /> E-posta ile Giriş
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {loginMode === 'quick' ? (
                        <motion.div
                            key="quick-mode"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4"
                        >
                            {/* Hotel Code Selection */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                                    <label htmlFor="quickHotelCode" className="flex items-center gap-1.5">
                                        <Hotel className="w-3.5 h-3.5 text-primary" /> Otel Kodu
                                    </label>
                                    {hotelCode && (
                                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Kaydedildi
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        id="quickHotelCode"
                                        value={hotelCode}
                                        onChange={(e) => handleHotelCodeChange(e.target.value)}
                                        className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors font-mono tracking-wide uppercase text-sm"
                                        placeholder="Örn: HOTEL123 veya DEMO"
                                        maxLength={12}
                                    />
                                    <Hotel className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                </div>
                            </div>

                            {/* Staff Cards Selector */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                                        Personel Seçimi & Tek Tıkla Giriş
                                    </h3>
                                    {isFetchingStaff && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                                </div>

                                {!hotelCode.trim() ? (
                                    <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500 space-y-1">
                                        <p>Lütfen oteliniz için tanımlanan Otel Kodunu giriniz.</p>
                                        <p className="text-[11px] text-zinc-600">Örnek deneme girişi için <code className="text-primary font-mono font-bold">DEMO</code> yazabilirsiniz.</p>
                                    </div>
                                ) : staffList.length === 0 && !isFetchingStaff ? (
                                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center text-xs text-zinc-400">
                                        Bu otel koduna bağlı aktif personel bulunamadı. Lütfen otel kodunu kontrol ediniz.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                                        {staffList.map((staff) => (
                                            <motion.button
                                                key={staff.uid}
                                                type="button"
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleQuickLogin(staff)}
                                                className="group flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/80 hover:border-primary/40 transition-all text-left shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                                                        staff.role === 'gm'
                                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                    }`}>
                                                        {staff.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                                                            <span className="truncate">{staff.name}</span>
                                                        </div>
                                                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                                            <span className="font-mono">{staff.email}</span>
                                                            <span>•</span>
                                                            <span className="capitalize text-primary/80 font-medium">
                                                                {staff.role === 'gm' ? 'Genel Müdür' : 'Resepsiyonist'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-1 bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                    <Zap className="w-3.5 h-3.5 fill-current" /> Giriş Yap
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(error || loginError) && (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                                    {loginError || error}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="email-mode"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <form onSubmit={handleSubmitEmail} className="space-y-3">
                                <div className="relative">
                                    <label htmlFor="hotelCode" className="sr-only">{t('auth.placeholder.hotelCode')}</label>
                                    <Hotel className="absolute left-3 top-3 w-4 h-4 text-zinc-500" aria-hidden="true" />
                                    <input
                                        id="hotelCode"
                                        name="hotelCode"
                                        autoComplete="organization"
                                        value={hotelCode}
                                        onChange={(e) => handleHotelCodeChange(e.target.value)}
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
                        </motion.div>
                    )}
                </AnimatePresence>

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
