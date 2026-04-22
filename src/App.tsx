import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TabNotifications } from '@/components/ui/TabNotifications'
import { UpdateNotifier } from '@/components/layout/UpdateNotifier'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { PageSkeleton } from '@/components/ui/skeleton'

import { useThemeStore } from '@/stores/themeStore'
import { ActivityTracker } from '@/components/tracking/ActivityTracker'
import { AIChatBot } from '@/components/ai/AIChatBot'

// Lazy-loaded pages — each becomes a separate chunk
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const SetupHotelPage = lazy(() => import('@/pages/SetupHotelPage').then(m => ({ default: m.SetupHotelPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const LiveDemoPage = lazy(() => import('@/pages/LiveDemoPage').then(m => ({ default: m.LiveDemoPage })))
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })))
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })))
const BlogPage = lazy(() => import('@/pages/BlogPage').then(m => ({ default: m.BlogPage })))
const UpdatesPage = lazy(() => import('@/pages/UpdatesPage').then(m => ({ default: m.UpdatesPage })))
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage').then(m => ({ default: m.FeaturesPage })))
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const ContactPage = lazy(() => import('@/pages/ContactPage').then(m => ({ default: m.ContactPage })))
const DownloadPage = lazy(() => import('@/pages/DownloadPage').then(m => ({ default: m.DownloadPage })))
const CommunityPage = lazy(() => import('@/pages/CommunityPage').then(m => ({ default: m.CommunityPage })))
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/legal/TermsPage').then(m => ({ default: m.TermsPage })))
const StatusPage = lazy(() => import('@/pages/legal/StatusPage').then(m => ({ default: m.StatusPage })))

function App() {
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
        <ConfirmProvider>
            <div className="relative">
                <BrowserRouter>
                    <UpdateNotifier />
                    <TabNotifications />
                    <CustomCursor />
                    <ActivityTracker />

                    {/* Sonner Toast — positioned bottom-right with theme-aware styling */}
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            className: 'bg-card border-border text-foreground',
                            duration: 4000,
                        }}
                        richColors
                        closeButton
                    />

                    <Suspense fallback={<PageSkeleton />}>
                        <Routes>
                            {/* Public Routes with Layout */}
                            <Route element={<PublicLayout />}>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/legal/privacy" element={<PrivacyPage />} />
                                <Route path="/legal/terms" element={<TermsPage />} />
                                <Route path="/legal/status" element={<StatusPage />} />
                                <Route path="/download" element={<DownloadPage onBack={() => window.history.back()} />} />
                                <Route path="/community" element={<CommunityPage onBack={() => window.history.back()} />} />
                                <Route path="/pricing" element={<PricingPage />} />
                                <Route path="/how-it-works" element={<HowItWorksPage />} />
                                <Route path="/blog" element={<BlogPage />} />
                                <Route path="/blog/:id" element={<BlogPostPage />} />
                                <Route path="/updates" element={<UpdatesPage />} />
                                <Route path="/features" element={<FeaturesPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                            </Route>

                            {/* Auth & Demo Pages */}
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
                    </Suspense>
                    <AIChatBot />
                </BrowserRouter>
            </div>
        </ConfirmProvider>
    )
}

export default App
