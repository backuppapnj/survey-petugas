import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, MessageSquareText, RotateCw, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { BorderBeam } from '@/components/ui/border-beam'
import { BlurFade } from '@/components/ui/blur-fade'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { RatingScale } from '@/components/survey/RatingScale'
import { UNSUR_LABEL } from '@/lib/ikm'
import { getPetugas, submitSurvei } from '@/lib/api'
import type { Petugas } from '@/types'
import { cn } from '@/lib/utils'

type Ratings = { kecepatan: number; keramahan: number; informasi: number; kenyamanan: number }

// Label unsur resmi PermenPAN-RB 14/2017 diambil dari UNSUR_LABEL agar konsisten
const ASPEK: Array<{ key: keyof Ratings; label: string }> = [
  { key: 'kecepatan', label: UNSUR_LABEL.kecepatan },
  { key: 'keramahan', label: UNSUR_LABEL.keramahan },
  { key: 'informasi', label: UNSUR_LABEL.informasi },
  { key: 'kenyamanan', label: UNSUR_LABEL.kenyamanan },
]

const SARAN_MAX = 1000
const EMPTY_RATINGS: Ratings = { kecepatan: 0, keramahan: 0, informasi: 0, kenyamanan: 0 }

export default function SurveyPage() {
  const { petugasId } = useParams<{ petugasId: string }>()
  const [petugas, setPetugas] = useState<Petugas | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [notFound, setNotFound] = useState<boolean>(false)
  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS)
  const [saran, setSaran] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const confettiRef = useRef<ConfettiRef>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!petugasId) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true)
    setNotFound(false)
    /* eslint-enable react-hooks/set-state-in-effect */
    getPetugas(Number(petugasId))
      .then(setPetugas)
      .catch(() => {
        setNotFound(true)
        toast.error('Petugas tidak ditemukan atau sudah tidak aktif')
      })
      .finally(() => setLoading(false))
  }, [petugasId])

  const filledCount = ASPEK.filter(({ key }) => ratings[key] > 0).length
  const isReady = filledCount === ASPEK.length

  const reset = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    setRatings(EMPTY_RATINGS)
    setSaran('')
    setSuccess(false)
  }

  const handleSubmit = async () => {
    if (!petugas || !isReady || submitting) return
    setSubmitting(true)
    try {
      await submitSurvei({
        petugas_id: petugas.id,
        kecepatan: ratings.kecepatan,
        keramahan: ratings.keramahan,
        informasi: ratings.informasi,
        kenyamanan: ratings.kenyamanan,
        saran,
      })
      setSuccess(true)
      confettiRef.current?.fire?.({})
      toast.success('Terima kasih atas penilaian Anda')
      // Auto-reset 6 detik untuk mode kiosk; cukup waktu untuk membaca pesan
      resetTimeoutRef.current = setTimeout(() => {
        resetTimeoutRef.current = null
        reset()
      }, 6000)
    } catch {
      toast.error('Gagal mengirim survei. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_38%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.95))] p-4 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.22),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.98))]">
      <AnimatedGridPattern
        data-testid="survey-grid-pattern"
        numSquares={52}
        maxOpacity={0.32}
        duration={3.6}
        repeatDelay={0.3}
        className={cn(
          'text-sky-400/35 [mask-image:radial-gradient(540px_circle_at_center,white,transparent)]',
        )}
      />
      <Confetti ref={confettiRef} className="pointer-events-none absolute inset-0 z-50" />

      <BlurFade delay={0.1}>
        <Card
          data-testid="survey-card"
          className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-blue-500/20 bg-card/94 shadow-[0_30px_80px_-44px_rgba(37,99,235,0.6)] backdrop-blur-sm"
        >
          <div className="absolute inset-x-6 top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300 opacity-90" />
          <BorderBeam size={250} duration={12} colorFrom="#38bdf8" colorTo="#2563eb" />
          <CardContent className="space-y-6 p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="mx-auto size-24 rounded-full" />
                <Skeleton className="mx-auto h-6 w-48" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : notFound || !petugas ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <UserX className="size-6 text-muted-foreground" aria-hidden />
                </div>
                <h1 className="text-lg font-semibold">Petugas tidak ditemukan</h1>
                <p className="text-sm text-muted-foreground">
                  QR code mungkin sudah tidak berlaku atau petugas non-aktif. Silakan hubungi
                  petugas pelayanan terdekat untuk pemindaian ulang.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="size-24">
                    <AvatarImage src={petugas.foto_url ?? undefined} alt={petugas.nama} />
                    <AvatarFallback
                      data-testid="survey-avatar-fallback"
                      className="bg-gradient-to-br from-sky-500 to-blue-600 text-xl font-semibold text-white"
                    >
                      {petugas.nama.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h1 className="text-xl font-semibold">{petugas.nama}</h1>
                    <p className="text-sm text-muted-foreground">
                      {petugas.loket} · {petugas.unit_kerja}
                    </p>
                  </div>
                </div>

                {success ? (
                  <div className="space-y-4 py-6 text-center">
                    <CheckCircle2
                      className="mx-auto size-16 text-emerald-500"
                      aria-hidden
                    />
                    <h2 className="text-2xl font-bold">Terima Kasih!</h2>
                    <p className="text-muted-foreground">
                      Penilaian Anda telah tersimpan dan akan membantu kami meningkatkan
                      pelayanan.
                    </p>
                    <Button variant="outline" onClick={reset} className="mt-2">
                      <RotateCw className="mr-2 size-4" />
                      Beri penilaian lagi
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Progress indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Progress penilaian
                        </span>
                        <span className="font-medium tabular-nums">
                          {filledCount} / {ASPEK.length} aspek
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/60">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${(filledCount / ASPEK.length) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={filledCount}
                          aria-valuemin={0}
                          aria-valuemax={ASPEK.length}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {ASPEK.map(({ key, label }) => (
                        <RatingScale
                          key={key}
                          label={label}
                          value={ratings[key]}
                          onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                        />
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="saran"
                        className="flex items-center gap-1.5 text-sm font-medium"
                      >
                        <MessageSquareText className="size-4" aria-hidden />
                        Saran (opsional)
                      </label>
                      <Textarea
                        id="saran"
                        placeholder="Tulis saran atau masukan Anda..."
                        value={saran}
                        onChange={(e) => setSaran(e.target.value.slice(0, SARAN_MAX))}
                        maxLength={SARAN_MAX}
                        rows={3}
                        aria-describedby="saran-counter"
                      />
                      <div
                        id="saran-counter"
                        className="flex justify-end text-xs text-muted-foreground tabular-nums"
                      >
                        {saran.length} / {SARAN_MAX}
                      </div>
                    </div>

                    <ShimmerButton
                      onClick={handleSubmit}
                      disabled={!isReady || submitting}
                      shimmerColor="#bfdbfe"
                      background="linear-gradient(135deg, rgba(14,165,233,0.98), rgba(37,99,235,0.98))"
                      className="app-gradient-button w-full border-blue-300/40 shadow-lg shadow-blue-500/25"
                      data-testid="submit-survey"
                      title={
                        !isReady
                          ? `Lengkapi ${ASPEK.length - filledCount} aspek yang tersisa`
                          : undefined
                      }
                    >
                      {submitting
                        ? 'Mengirim...'
                        : isReady
                          ? 'Kirim Penilaian'
                          : `Lengkapi ${ASPEK.length - filledCount} aspek lagi`}
                    </ShimmerButton>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  )
}
