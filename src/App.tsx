import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SetupHotelPage } from '@/pages/SetupHotelPage'
import { DashboardPage } from '@/pages/DashboardPage'
import ShiftStartPage from '@/pages/ShiftStartPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { TabNotifications } from '@/components/ui/TabNotifications'
import { UpdateNotifier } from '@/components/layout/UpdateNotifier'

import { useThemeStore } from '@/stores/themeStore'
import { useEffect } from 'react'

function App() {
    const applyTheme = useThemeStore(state => state.applyTheme)

    useEffect(() => {
        applyTheme()
    }, [applyTheme])

    return (
        <BrowserRouter>
            <UpdateNotifier />
            <TabNotifications />
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

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
                    path="/operations"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App
