import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, TriangleAlert, User } from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import type { ApiError } from '@/types'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { settings } = useSettings()
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
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.95))] p-4 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.98))]">
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
      <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-blue-500/20 bg-card/95 px-2 py-2 shadow-[0_28px_80px_-42px_rgba(37,99,235,0.55)] backdrop-blur-sm">
        <div
          data-testid="login-card-shimmer"
          className="absolute inset-x-6 top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300 opacity-90"
        />
        <CardHeader className="space-y-4 pt-6 pb-2 text-center">
          <div
            data-testid="login-icon-container"
            className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10"
          >
            <ShieldCheck className="size-8" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">
              <AnimatedGradientText
                data-testid="login-title-gradient"
                colorFrom="#38bdf8"
                colorTo="#2563eb"
                className="font-semibold"
              >
                {settings.app_title}
              </AnimatedGradientText>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{settings.app_subtitle}</p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pt-2 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Masukkan username"
                  className="h-11 border-blue-200/70 bg-background/85 pl-10 focus-visible:border-blue-400 focus-visible:ring-blue-500/25 dark:border-blue-900/60 dark:bg-slate-950/60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
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
                  placeholder="Masukkan password"
                  className="h-11 border-blue-200/70 bg-background/85 pr-11 pl-10 focus-visible:border-blue-400 focus-visible:ring-blue-500/25 dark:border-blue-900/60 dark:bg-slate-950/60"
                  aria-describedby={capsOn ? 'caps-warning' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="tap-target absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-300"
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
                <p
                  id="caps-warning"
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                >
                  <TriangleAlert className="size-3.5" aria-hidden />
                  Caps Lock aktif
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="app-gradient-button h-11 w-full border border-blue-300/40 bg-gradient-to-r from-sky-500 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-sky-400 hover:to-blue-500"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Memproses...
                </>
              ) : (
                'Login'
              )}
            </Button>
            <div className="border-t border-border/60 pt-4">
              <p className="text-center text-xs text-muted-foreground">
                {settings.login_help_text}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
