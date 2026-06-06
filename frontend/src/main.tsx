import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { SettingsProvider } from '@/components/SettingsProvider'
import App from './App'
import './index.css'

// Basename router disamakan dengan "base" Vite. Saat build produksi aplikasi
// dilayani dari "/app/" oleh CodeIgniter, sedangkan saat dev berjalan di "/".
// import.meta.env.BASE_URL otomatis bernilai "/app/" (build) atau "/" (dev),
// sehingga refresh pada sub-route seperti /app/login tetap konsisten.
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SettingsProvider>
          <BrowserRouter basename={routerBasename}>
            <App />
            <Toaster richColors position="top-center" closeButton />
          </BrowserRouter>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
