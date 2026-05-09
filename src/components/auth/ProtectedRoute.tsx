import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
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

    if (!initialized || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" aria-label="Loading" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'gm') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
                    <p className="text-sm text-muted-foreground">
                        You don't have permission to access this page.
                    </p>
                </div>
            </div>
        )
    }

    if (!user.hotel_id && location.pathname !== '/setup-hotel') {
        return <Navigate to="/setup-hotel" replace />
    }

    return <>{children}</>
}
