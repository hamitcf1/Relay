import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SetupHotelPage } from '@/pages/SetupHotelPage'
import { DashboardPage } from '@/pages/DashboardPage'
import ShiftStartPage from '@/pages/ShiftStartPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function App() {
    return (
        <BrowserRouter>
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
