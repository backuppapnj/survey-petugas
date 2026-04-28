import { Navigate, Route, Routes } from 'react-router-dom'
import SurveyPage from '@/pages/SurveyPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PetugasPage from '@/pages/PetugasPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Survey publik (kiosk-friendly) */}
      <Route path="/survey/:petugasId" element={<SurveyPage />} />

      {/* Login admin */}
      <Route path="/login" element={<LoginPage />} />

      {/* Area admin */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/petugas" element={<PetugasPage />} />
      </Route>

      {/* 404 informatif */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
