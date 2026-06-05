import { useEffect, useMemo, useState } from 'react'
import { MessageSquareText, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Marquee } from '@/components/ui/marquee'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Petugas, SurveiRecord } from '@/types'

interface Props {
  data: SurveiRecord[]
  petugas: Petugas[]
}

type RatingFilter = 'all' | 'low' | 'high'

const formatTanggal = (iso: string): string => {
  try {
    const d = new Date(iso.replace(' ', 'T'))
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const rataAspek = (r: SurveiRecord): number =>
  (r.kecepatan + r.keramahan + r.informasi + r.kenyamanan) / 4

const potongSaran = (value: string): string =>
  value.length > 72 ? `${value.slice(0, 72).trimEnd()}...` : value

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference)
      return () => mediaQuery.removeEventListener('change', updatePreference)
    }

    mediaQuery.addListener(updatePreference)
    return () => mediaQuery.removeListener(updatePreference)
  }, [])

  return prefersReducedMotion
}

export function SaranList({ data, petugas }: Props) {
  const [filter, setFilter] = useState<RatingFilter>('all')
  const prefersReducedMotion = usePrefersReducedMotion()

  const namaPetugas = useMemo(() => {
    const map = new Map<number, string>()
    petugas.forEach((p) => map.set(p.id, p.nama))
    return map
  }, [petugas])

  const items = useMemo(() => {
    return data
      .filter((r) => r.saran && r.saran.trim().length > 0)
      .filter((r) => {
        if (filter === 'all') return true
        const avg = rataAspek(r)
        return filter === 'low' ? avg < 4 : avg >= 4
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [data, filter])

  const totalAll = data.filter((r) => r.saran && r.saran.trim().length > 0).length
  const totalLow = data.filter(
    (r) => r.saran && r.saran.trim().length > 0 && rataAspek(r) < 4,
  ).length
  const headlineItems = useMemo(() => items.slice(0, 10), [items])

  return (
    <Card className="border border-blue-500/20 shadow-[0_18px_55px_-38px_rgba(37,99,235,0.55)]">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="size-5" aria-hidden />
              Saran &amp; Komentar Responden
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalAll} saran masuk · {totalLow} berasal dari rating &lt;4 (perlu perhatian)
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={cn(
                filter === 'all' && 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              Semua ({totalAll})
            </Button>
            <Button
              size="sm"
              variant={filter === 'low' ? 'default' : 'outline'}
              onClick={() => setFilter('low')}
              className={cn(
                filter === 'low' && 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-700',
              )}
            >
              Rating &lt;4 ({totalLow})
            </Button>
            <Button
              size="sm"
              variant={filter === 'high' ? 'default' : 'outline'}
              onClick={() => setFilter('high')}
              className={cn(
                filter === 'high' && 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              Rating ≥4 ({totalAll - totalLow})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <MessageSquareText className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {totalAll === 0
                ? 'Belum ada responden yang menulis saran pada periode ini.'
                : 'Tidak ada saran yang cocok dengan filter.'}
            </p>
          </div>
        ) : (
          <>
            {headlineItems.length > 0 && (
              <section aria-label="Sorotan saran terbaru" className="space-y-2">
                <ul aria-label="Ringkasan saran terbaru" className="sr-only">
                  {headlineItems.map((item) => (
                    <li key={item.id}>
                      {(namaPetugas.get(item.petugas_id) ?? `Petugas #${item.petugas_id}`)}: {' '}
                      {potongSaran(item.saran ?? '')}
                    </li>
                  ))}
                </ul>

                <div
                  aria-hidden="true"
                  className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-1"
                >
                  {prefersReducedMotion ? (
                    <div className="flex flex-wrap gap-2 px-2 py-1">
                      {headlineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
                        >
                          <span className="font-medium text-foreground">
                            {namaPetugas.get(item.petugas_id) ?? `Petugas #${item.petugas_id}`}
                          </span>
                          <span>{potongSaran(item.saran ?? '')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Marquee pauseOnHover className="[--duration:26s] py-1">
                      {headlineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
                        >
                          <span className="font-medium text-foreground">
                            {namaPetugas.get(item.petugas_id) ?? `Petugas #${item.petugas_id}`}
                          </span>
                          <span>{potongSaran(item.saran ?? '')}</span>
                        </div>
                      ))}
                    </Marquee>
                  )}
                </div>
              </section>
            )}

            <ScrollArea className="h-80 pr-4">
              <ul aria-label="Daftar saran responden" className="space-y-3">
                {items.map((r) => {
                  const avg = rataAspek(r)
                  const low = avg < 4
                  return (
                    <li
                      key={r.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        low &&
                          'border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={low ? 'destructive' : 'secondary'} className="gap-1">
                          <Star className="size-3 fill-current" aria-hidden />
                          {avg.toFixed(2)}
                        </Badge>
                        <span className="font-medium">
                          {namaPetugas.get(r.petugas_id) ?? `Petugas #${r.petugas_id}`}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTanggal(r.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed">{r.saran}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>Kecepatan: <strong className="text-foreground">{r.kecepatan}</strong></span>
                        <span>·</span>
                        <span>Keramahan: <strong className="text-foreground">{r.keramahan}</strong></span>
                        <span>·</span>
                        <span>Informasi: <strong className="text-foreground">{r.informasi}</strong></span>
                        <span>·</span>
                        <span>Kenyamanan: <strong className="text-foreground">{r.kenyamanan}</strong></span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
