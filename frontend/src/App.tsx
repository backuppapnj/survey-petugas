import { Route, Routes } from 'react-router-dom'
import SurveyPage from '@/pages/SurveyPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PetugasPage from '@/pages/PetugasPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/survey/:petugasId" element={<SurveyPage />} />
      <Route path="/login" element={<LoginPage />} />
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
    </Routes>
  )
}
