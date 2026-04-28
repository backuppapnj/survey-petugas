import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShineBorder } from '@/components/ui/shine-border'
import { DotPattern } from '@/components/ui/dot-pattern'
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <DotPattern
        className={cn('[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')}
      />
      <Card className="relative w-full max-w-sm overflow-hidden">
        <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-6 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-xl">Survei Kepuasan PTSP</CardTitle>
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
                  className="pr-10"
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
            <Button type="submit" className="w-full" disabled={submitting}>
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
