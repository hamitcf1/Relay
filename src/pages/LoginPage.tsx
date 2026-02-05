import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
    const navigate = useNavigate()
    const { signIn, loading, error, clearError } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()

        await signIn(email, password)

        // Navigate on success (auth state will update)
        const user = useAuthStore.getState().user
        if (user) {
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
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
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 glow-primary mb-4">
                            <Hotel className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gradient-primary">Relay</h1>
                        <p className="text-zinc-400 mt-2">Hotel Operations System</p>
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
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Email</label>
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

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Password</label>
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

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {error}
                            </motion.div>
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
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
                        <p className="text-zinc-500">
                            Don't have an account?{' '}
                            <a href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                                Register here
                            </a>
                        </p>
                        <p className="text-zinc-600 text-xs">
                            Contact your GM for account access
                        </p>
                    </motion.div>
                </div>

                {/* Decorative glow under card */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/20 blur-3xl rounded-full" />
            </motion.div>
        </div>
    )
}
