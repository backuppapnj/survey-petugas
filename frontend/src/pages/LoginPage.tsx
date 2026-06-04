import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { useAuth } from '@/hooks/useAuth'
import type { ApiError } from '@/types'

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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        className="absolute inset-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
      />
      <Card className="relative w-full max-w-sm overflow-hidden rounded-2xl border-blue-200 shadow-lg shadow-blue-500/10 dark:border-blue-800/40">
        <div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="size-6 text-white" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-xl">
              <AnimatedGradientText className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
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
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500"
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
                  className="pr-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500"
                  aria-describedby={capsOn ? 'caps-warning' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
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
              className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-md shadow-blue-500/25 text-white"
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
