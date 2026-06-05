import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NILAI_PERSEPSI, UNSUR_LABEL } from '@/lib/ikm'
import type { SurveiRecord } from '@/types'

interface Props {
  data: SurveiRecord[]
}

const ASPEK = [
  {
    key: 'kecepatan',
    label: UNSUR_LABEL.kecepatan,
    color: 'var(--chart-1)',
    gradientFrom: 'rgba(14, 165, 233, 0.95)',
    gradientTo: 'rgba(37, 99, 235, 0.82)',
  },
  {
    key: 'keramahan',
    label: UNSUR_LABEL.keramahan,
    color: 'var(--chart-2)',
    gradientFrom: 'rgba(16, 185, 129, 0.95)',
    gradientTo: 'rgba(13, 148, 136, 0.82)',
  },
  {
    key: 'informasi',
    label: UNSUR_LABEL.informasi,
    color: 'var(--chart-3)',
    gradientFrom: 'rgba(59, 130, 246, 0.95)',
    gradientTo: 'rgba(14, 165, 233, 0.82)',
  },
  {
    key: 'kenyamanan',
    label: UNSUR_LABEL.kenyamanan,
    color: 'var(--chart-4)',
    gradientFrom: 'rgba(45, 212, 191, 0.95)',
    gradientTo: 'rgba(16, 185, 129, 0.82)',
  },
] as const

export function RatingDistribution({ data }: Props) {
  const stats = useMemo(() => {
    return ASPEK.map(({ key, label, color, gradientFrom, gradientTo }) => {
      const buckets = [0, 0, 0, 0] // index 0 -> nilai 1 (Tidak Baik), dst
      data.forEach((r) => {
        const v = r[key]
        if (v >= 1 && v <= 4) buckets[v - 1] += 1
      })
      const total = buckets.reduce((s, n) => s + n, 0)
      return { key, label, color, gradientFrom, gradientTo, buckets, total }
    })
  }, [data])

  const grandTotal = data.length

  return (
    <Card
      data-testid="rating-distribution-card"
      className="border border-blue-500/20 shadow-[0_18px_55px_-38px_rgba(37,99,235,0.55)]"
    >
      <CardHeader>
        <CardTitle>Distribusi Rating per Aspek</CardTitle>
        <p className="text-xs text-muted-foreground">
          Berapa banyak responden memberi nilai 1–4 (Tidak Baik s/d Sangat Baik) per aspek ({grandTotal} responden).
        </p>
      </CardHeader>
      <CardContent>
        {grandTotal === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Belum ada data untuk periode ini.
          </div>
        ) : (
          <div className="space-y-5">
            {stats.map(({ key, label, color, gradientFrom, gradientTo, buckets, total }) => (
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
                          {star}. {NILAI_PERSEPSI[i].label}
                        </span>
                        <div
                          className="h-2 rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={Math.round(pct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${label} — ${NILAI_PERSEPSI[i].label}: ${count} respon (${pct.toFixed(1)}%)`}
                        >
                          <div
                            data-testid={`rating-bar-${key}-${star}`}
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundImage: isLow
                                ? 'linear-gradient(90deg, rgba(251, 113, 133, 0.95), rgba(244, 63, 94, 0.82))'
                                : `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
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
