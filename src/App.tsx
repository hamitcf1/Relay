import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { MotionConfig, AnimatePresence } from 'framer-motion'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TabNotifications } from '@/components/ui/TabNotifications'
import { UpdateNotifier } from '@/components/layout/UpdateNotifier'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PageSkeleton } from '@/components/ui/skeleton'

import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { ActivityTracker } from '@/components/tracking/ActivityTracker'
import { AIChatBot } from '@/components/ai/AIChatBot'
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications'
import { CyberLoadingScreen } from '@/components/ui/CyberLoadingScreen'

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
const VoucherPage = lazy(() => import('@/pages/VoucherPage').then(m => ({ default: m.VoucherPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

function ProtectedDashboardShell() {
    const user = useAuthStore(s => s.user)
    const isBooted = useAuthStore(s => s.isBooted)
    const setBooted = useAuthStore(s => s.setBooted)

    // Here rather than inside the dashboard, so it stays up for the whole session instead of only
    // while the overview module happens to be on screen. A manager who lives in another module all
    // day still needs to be told. This runs before the dashboard's own subscriptions are set up,
    // which is why the store carries a `loaded` flag: the hook has to know the difference between
    // "nothing has arrived yet" and "nothing is there".
    useDesktopNotifications()

    return (
        <ProtectedRoute>
            <ActivityTracker />
            <AIChatBot />
            <div className="relative w-full h-full">
                <DashboardPage />
                <AnimatePresence>
                    {user && !isBooted && (
                        <CyberLoadingScreen onComplete={() => setBooted(true)} />
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    )
}

/**
 * Route level boundary.
 *
 * Keyed by pathname so navigating away from a page that threw clears the error. Without this the
 * user would be stuck: the boundary shows a retry button, but retrying a genuinely broken page
 * just fails again and there is no way back into the app.
 */
function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    return (
        <ErrorBoundary resetKeys={[location.pathname]}>
            {children}
        </ErrorBoundary>
    )
}

function App() {
    const applyTheme = useThemeStore(s => s.applyTheme)
    const disableAnimations = useAuthStore(s => s.user?.settings?.disable_animations)

    useEffect(() => {
        applyTheme()
    }, [applyTheme])

    useEffect(() => {
        document.body.classList.toggle('disable-animations', !!disableAnimations)
    }, [disableAnimations])

    return (
        <ConfirmProvider>
            <MotionConfig reducedMotion={disableAnimations ? "always" : "user"}>
                <BrowserRouter>
                    <UpdateNotifier />
                    <TabNotifications />

                    <Toaster
                        position="bottom-right"
                        theme="system"
                        toastOptions={{
                            duration: 4000,
                            classNames: {
                                toast: 'group toast bg-card text-card-foreground border-[5px] border-surface-deep shadow-lg rounded-[1.25rem]',
                                description: 'text-muted-foreground',
                                actionButton: 'bg-primary text-primary-foreground',
                                cancelButton: 'bg-muted text-muted-foreground',
                                closeButton: 'bg-card border-border text-muted-foreground hover:text-foreground',
                            },
                        }}
                        closeButton
                    />

                    <RouteErrorBoundary>
                        <Suspense fallback={<PageSkeleton />}>
                            <Routes>
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

                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/live-demo" element={<LiveDemoPage />} />
                                <Route path="/voucher" element={<VoucherPage />} />

                                <Route
                                    path="/setup-hotel"
                                    element={
                                        <ProtectedRoute>
                                            <SetupHotelPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/dashboard" element={<ProtectedDashboardShell />} />
                                <Route path="/operations" element={<ProtectedDashboardShell />} />
                                <Route
                                    path="/notifications"
                                    element={
                                        <ProtectedRoute>
                                            <NotificationsPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </Suspense>
                    </RouteErrorBoundary>
                </BrowserRouter>
            </MotionConfig>
        </ConfirmProvider>
    )
}

export default App
