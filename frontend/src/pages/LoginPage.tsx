import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import type { ApiError } from '@/types'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [capsOn, setCapsOn] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login({ username, password })
      toast.success('Login berhasil')
      navigate('/dashboard')
    } catch (err) {
      const axErr = err as AxiosError<ApiError>
      const msg = axErr.response?.data?.error ?? 'Login gagal. Periksa kembali kredensial Anda.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.95))] p-4 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.98))]">
      <AnimatedGridPattern
        data-testid="login-grid-pattern"
        numSquares={40}
        maxOpacity={0.35}
        duration={3.4}
        repeatDelay={0.25}
        className={cn(
          'text-sky-400/40 [mask-image:radial-gradient(480px_circle_at_center,white,transparent)]',
        )}
      />
      <Card className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-blue-500/20 bg-card/92 shadow-[0_28px_80px_-42px_rgba(37,99,235,0.55)] backdrop-blur-sm">
        <div
          data-testid="login-card-shimmer"
          className="absolute inset-x-6 top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300 opacity-90"
        />
        <CardHeader className="space-y-3 text-center">
          <div
            data-testid="login-icon-container"
            className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
          >
            <ShieldCheck className="size-7" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-xl">
              <AnimatedGradientText
                data-testid="login-title-gradient"
                colorFrom="#38bdf8"
                colorTo="#2563eb"
                className="font-semibold"
              >
                Survei Kepuasan PTSP
              </AnimatedGradientText>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Login Administrator
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="admin"
                className="border-blue-200/70 bg-background/85 focus-visible:border-blue-400 focus-visible:ring-blue-500/25 dark:border-blue-900/60 dark:bg-slate-950/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) =>
                    setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))
                  }
                  onKeyDown={(e) =>
                    setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))
                  }
                  required
                  autoComplete="current-password"
                  className="border-blue-200/70 bg-background/85 pr-10 focus-visible:border-blue-400 focus-visible:ring-blue-500/25 dark:border-blue-900/60 dark:bg-slate-950/60"
                  aria-describedby={capsOn ? 'caps-warning' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {capsOn && (
                <p id="caps-warning" className="text-xs text-amber-600 dark:text-amber-400">
                  Caps Lock aktif
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="app-gradient-button w-full border border-blue-300/40 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:from-sky-400 hover:to-blue-500"
              disabled={submitting}
            >
              {submitting ? 'Memproses...' : 'Login'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Lupa password? Hubungi pengelola sistem.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
