import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'gm' | 'receptionist' | 'housekeeping'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, initialized, loading, initialize } = useAuthStore()
    const location = useLocation()

    useEffect(() => {
        const unsubscribe = initialize()
        return () => unsubscribe()
    }, [initialize])

    // Show loading screen while initializing
    if (!initialized || loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-zinc-400">Loading...</p>
                </motion.div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole && user.role !== 'gm') {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <motion.div
                    className="text-center p-8 glass rounded-2xl max-w-md mx-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <h2 className="text-xl font-bold text-rose-400 mb-2">Access Denied</h2>
                    <p className="text-zinc-400">
                        You don't have permission to access this page.
                    </p>
                </motion.div>
            </div>
        )
    }

    return <>{children}</>
}
