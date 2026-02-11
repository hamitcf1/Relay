import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SetupHotelPage } from '@/pages/SetupHotelPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LiveDemoPage } from '@/pages/LiveDemoPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { StatusPage } from '@/pages/legal/StatusPage'
import ShiftStartPage from '@/pages/ShiftStartPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { TabNotifications } from '@/components/ui/TabNotifications'
import { UpdateNotifier } from '@/components/layout/UpdateNotifier'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { CustomCursor } from '@/components/ui/CustomCursor'

import { useThemeStore } from '@/stores/themeStore'
import { useEffect } from 'react'
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities'
import { ActivityTracker } from '@/components/tracking/ActivityTracker'

function App() {
    useMobileCapabilities()
    const applyTheme = useThemeStore(state => state.applyTheme)

    useEffect(() => {
        applyTheme()

        // Global right-click prevention
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
        }

        window.addEventListener('contextmenu', handleContextMenu)
        return () => window.removeEventListener('contextmenu', handleContextMenu)
    }, [applyTheme])

    return (
        <BrowserRouter>
            <UpdateNotifier />
            <TabNotifications />
            <CustomCursor />
            <ActivityTracker />
            <Routes>

                {/* Public Routes with Layout */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/legal/privacy" element={<PrivacyPage />} />
                    <Route path="/legal/privacy" element={<PrivacyPage />} />
                    <Route path="/legal/terms" element={<TermsPage />} />
                    <Route path="/legal/status" element={<StatusPage />} />
                </Route>

                {/* Auth & Demo Pages (No Layout for now, or maybe wrap if desired, keeping separate for unique design) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/live-demo" element={<LiveDemoPage />} />

                {/* Protected Routes */}
                <Route
                    path="/setup-hotel"
                    element={
                        <ProtectedRoute>
                            <SetupHotelPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/shift-start"
                    element={
                        <ProtectedRoute>
                            <ShiftStartPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/operations"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter >
    )
}

export default App
