import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-4 rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
          <FileSearch className="size-8 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Error 404</p>
          <h1 className="mt-1 text-2xl font-bold">Halaman tidak ditemukan</h1>
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
          <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
            {isAuthenticated ? 'Ke Dashboard' : 'Ke Halaman Login'}
          </Button>
        </div>
      </div>
    </div>
  )
}
