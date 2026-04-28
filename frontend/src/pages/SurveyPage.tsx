import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, MessageSquareText, RotateCw, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { BorderBeam } from '@/components/ui/border-beam'
import { BlurFade } from '@/components/ui/blur-fade'
import { DotPattern } from '@/components/ui/dot-pattern'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { StarRating } from '@/components/survey/StarRating'
import { getPetugas, submitSurvei } from '@/lib/api'
import type { Petugas } from '@/types'
import { cn } from '@/lib/utils'

type Ratings = { kecepatan: number; keramahan: number; informasi: number; kenyamanan: number }

const ASPEK: Array<{ key: keyof Ratings; label: string }> = [
  { key: 'kecepatan', label: 'Kecepatan' },
  { key: 'keramahan', label: 'Keramahan' },
  { key: 'informasi', label: 'Informasi' },
  { key: 'kenyamanan', label: 'Kenyamanan' },
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
    setRatings(EMPTY_RATINGS)
    setSaran('')
    setSuccess(false)
  }

  const handleSubmit = async () => {
    if (!petugas || !isReady) return
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
      setTimeout(reset, 6000)
    } catch {
      toast.error('Gagal mengirim survei. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <DotPattern
        className={cn('[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')}
      />
      <Confetti ref={confettiRef} className="pointer-events-none absolute inset-0 z-50" />

      <BlurFade delay={0.1}>
        <Card className="relative w-full max-w-md overflow-hidden">
          <BorderBeam size={250} duration={12} />
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
                    <AvatarImage src={petugas.foto_url} alt={petugas.nama} />
                    <AvatarFallback>{petugas.nama.charAt(0)}</AvatarFallback>
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
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-300"
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
                        <StarRating
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
                      className="w-full"
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
