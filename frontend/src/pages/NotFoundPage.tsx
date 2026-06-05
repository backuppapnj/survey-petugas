import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { Button } from '@/components/ui/button'
import { HexagonPattern } from '@/components/ui/hexagon-pattern'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_38%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.95))] p-4 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.22),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.98))]">
      <HexagonPattern
        data-testid="not-found-hexagon-pattern"
        radius={36}
        gap={10}
        className="text-sky-400/25 [mask-image:radial-gradient(520px_circle_at_center,white,transparent)]"
      />
      <div className="relative max-w-md space-y-4 rounded-[28px] border border-blue-500/20 bg-card/94 p-8 text-center shadow-[0_28px_80px_-44px_rgba(37,99,235,0.55)] backdrop-blur-sm">
        <div
          data-testid="not-found-icon-container"
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300"
        >
          <FileSearch className="size-8" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Error 404</p>
          <h1 className="mt-1 text-2xl font-bold">
            <AnimatedGradientText
              data-testid="not-found-title-gradient"
              colorFrom="#38bdf8"
              colorTo="#2563eb"
            >
              Halaman tidak ditemukan
            </AnimatedGradientText>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            URL yang Anda akses tidak tersedia. Periksa kembali tautan atau gunakan tombol di
            bawah untuk kembali.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Button>
          <Button
            className="app-gradient-button border border-blue-300/40 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:from-sky-400 hover:to-blue-500"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Ke Dashboard' : 'Ke Halaman Login'}
          </Button>
        </div>
      </div>
    </div>
  )
}
