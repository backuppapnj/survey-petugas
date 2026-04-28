import { useMemo, useState } from 'react'
import { MessageSquareText, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function SaranList({ data, petugas }: Props) {
  const [filter, setFilter] = useState<RatingFilter>('all')

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

  return (
    <Card>
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
            >
              Rating ≥4 ({totalAll - totalLow})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
          <ScrollArea className="h-80 pr-4">
            <ul className="space-y-3">
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
        )}
      </CardContent>
    </Card>
  )
}
