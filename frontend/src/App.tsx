import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SurveyPage from '@/pages/SurveyPage'
import LoginPage from '@/pages/LoginPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// PERFORMA: halaman admin di-lazy-load agar bundle awal (halaman survey publik
// kiosk & login) tidak ikut mengunduh dependency berat seperti recharts yang
// hanya dipakai dashboard. Chunk dimuat saat rute admin diakses.
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const PetugasPage = lazy(() => import('@/pages/PetugasPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Fallback ringan saat chunk halaman sedang diunduh.
function PageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
      Memuat…
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Survey publik (kiosk-friendly) — parameter :token adalah 16-karakter hex */}
        <Route path="/survey/:token" element={<SurveyPage />} />

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
    </Suspense>
  )
}
