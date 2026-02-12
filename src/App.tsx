import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
    LandingPage,
    LoginPage,
    RegisterPage,
    SetupHotelPage,
    DashboardPage,
    LiveDemoPage,
    ShiftStartPage,
    PricingPage,
    HowItWorksPage,
    BlogPage,
    UpdatesPage,
    FeaturesPage,
    BlogPostPage,
    ContactPage
} from '@/pages'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { StatusPage } from '@/pages/legal/StatusPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { TabNotifications } from '@/components/ui/TabNotifications'
import { UpdateNotifier } from '@/components/layout/UpdateNotifier'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { CustomCursor } from '@/components/ui/CustomCursor'

import { useThemeStore } from '@/stores/themeStore'
import { useEffect } from 'react'
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities'
import { ActivityTracker } from '@/components/tracking/ActivityTracker'
import { AIChatBot } from '@/components/ai/AIChatBot'

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
                    <Route path="/legal/privacy" element={<PrivacyPage />} />
                    <Route path="/legal/terms" element={<TermsPage />} />
                    <Route path="/legal/status" element={<StatusPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:id" element={<BlogPostPage />} />
                    <Route path="/updates" element={<UpdatesPage />} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/contact" element={<ContactPage />} />
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
            <AIChatBot />
        </BrowserRouter >
    )
}

export default App
