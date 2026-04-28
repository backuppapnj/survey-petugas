import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SurveiRecord } from '@/types'

interface Props {
  data: SurveiRecord[]
}

const ASPEK = [
  { key: 'kecepatan', label: 'Kecepatan', color: 'var(--chart-1)' },
  { key: 'keramahan', label: 'Keramahan', color: 'var(--chart-2)' },
  { key: 'informasi', label: 'Informasi', color: 'var(--chart-3)' },
  { key: 'kenyamanan', label: 'Kenyamanan', color: 'var(--chart-4)' },
] as const

export function RatingDistribution({ data }: Props) {
  const stats = useMemo(() => {
    return ASPEK.map(({ key, label, color }) => {
      const buckets = [0, 0, 0, 0, 0] // index 0 -> bintang 1, dst
      data.forEach((r) => {
        const v = r[key]
        if (v >= 1 && v <= 5) buckets[v - 1] += 1
      })
      const total = buckets.reduce((s, n) => s + n, 0)
      return { key, label, color, buckets, total }
    })
  }, [data])

  const grandTotal = data.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Rating per Aspek</CardTitle>
        <p className="text-xs text-muted-foreground">
          Berapa banyak responden memberi 1–5 bintang per aspek ({grandTotal} responden).
        </p>
      </CardHeader>
      <CardContent>
        {grandTotal === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Belum ada data untuk periode ini.
          </div>
        ) : (
          <div className="space-y-5">
            {stats.map(({ key, label, color, buckets, total }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: color }}
                      aria-hidden
                    />
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">{total} respon</span>
                </div>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs">
                  {buckets.map((count, i) => {
                    const star = i + 1
                    const pct = total === 0 ? 0 : (count / total) * 100
                    const isLow = star <= 2
                    return (
                      <div
                        key={star}
                        className="contents"
                      >
                        <span className="flex items-center gap-1 tabular-nums text-muted-foreground">
                          <Star
                            className={cn(
                              'size-3',
                              isLow ? 'fill-rose-400 text-rose-400' : 'fill-yellow-400 text-yellow-400',
                            )}
                            aria-hidden
                          />
                          {star}
                        </span>
                        <div
                          className="h-2 rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={Math.round(pct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${label} bintang ${star}: ${count} respon (${pct.toFixed(1)}%)`}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: isLow ? 'oklch(0.62 0.22 25)' : color,
                            }}
                          />
                        </div>
                        <span className="tabular-nums text-muted-foreground">
                          {count} <span className="opacity-60">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
