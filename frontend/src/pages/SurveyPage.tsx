import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

export default function SurveyPage() {
  const { petugasId } = useParams<{ petugasId: string }>()
  const [petugas, setPetugas] = useState<Petugas | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [ratings, setRatings] = useState<Ratings>({ kecepatan: 0, keramahan: 0, informasi: 0, kenyamanan: 0 })
  const [saran, setSaran] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const confettiRef = useRef<ConfettiRef>(null)

  useEffect(() => {
    if (!petugasId) return
    setLoading(true)
    getPetugas(Number(petugasId))
      .then(setPetugas)
      .catch(() => toast.error('Gagal memuat data petugas'))
      .finally(() => setLoading(false))
  }, [petugasId])

  const isReady = ASPEK.every(({ key }) => ratings[key] > 0)

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
      // Auto-reset 3 detik untuk mode kiosk
      setTimeout(() => {
        setRatings({ kecepatan: 0, keramahan: 0, informasi: 0, kenyamanan: 0 })
        setSaran('')
        setSuccess(false)
      }, 3000)
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
            ) : petugas ? (
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
                  <div className="py-12 text-center">
                    <h2 className="text-2xl font-bold text-primary">Terima Kasih!</h2>
                    <p className="mt-2 text-muted-foreground">Penilaian Anda telah tersimpan.</p>
                  </div>
                ) : (
                  <>
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

                    <Textarea
                      placeholder="Saran (opsional)..."
                      value={saran}
                      onChange={(e) => setSaran(e.target.value)}
                      maxLength={1000}
                    />

                    <ShimmerButton
                      onClick={handleSubmit}
                      disabled={!isReady || submitting}
                      className="w-full"
                      data-testid="submit-survey"
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Penilaian'}
                    </ShimmerButton>
                  </>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-muted-foreground">Petugas tidak ditemukan.</p>
            )}
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  )
}
