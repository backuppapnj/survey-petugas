import { Award, Gauge, Users } from 'lucide-react'
import { MagicCard } from '@/components/ui/magic-card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Badge } from '@/components/ui/badge'
import { categorizeIkm } from '@/lib/ikm'
import { cn } from '@/lib/utils'
import type { RekapSummary } from '@/types'

const ASPEK_META: Array<{
  key: 'kecepatan' | 'keramahan' | 'informasi' | 'kenyamanan'
  label: string
  color: string
}> = [
  { key: 'kecepatan', label: 'Kecepatan', color: 'var(--chart-1)' },
  { key: 'keramahan', label: 'Keramahan', color: 'var(--chart-2)' },
  { key: 'informasi', label: 'Informasi', color: 'var(--chart-3)' },
  { key: 'kenyamanan', label: 'Kenyamanan', color: 'var(--chart-4)' },
]

export function SummaryCards({ summary }: { summary: RekapSummary }) {
  const kategori = categorizeIkm(summary.ikm)

  return (
    <div className="space-y-4">
      {/* Baris 1: Headline metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MagicCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Responden</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                <NumberTicker value={summary.total_responden} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.total_responden === 0
                  ? 'Belum ada survei pada periode ini'
                  : 'Survei tervalidasi pada periode terpilih'}
              </p>
            </div>
            <Users className="size-5 text-muted-foreground" aria-hidden />
          </div>
        </MagicCard>

        <MagicCard className="p-6">
          <div className="flex items-center gap-4">
            <AnimatedCircularProgressBar
              max={100}
              value={summary.ikm}
              min={0}
              gaugePrimaryColor="var(--primary)"
              gaugeSecondaryColor="var(--muted)"
              className="size-24 text-base"
            />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Nilai IKM</p>
              <p className="text-3xl font-bold tabular-nums">
                <NumberTicker value={summary.ikm} decimalPlaces={2} />
              </p>
              <p className="text-xs text-muted-foreground">Skala 25–100</p>
            </div>
          </div>
        </MagicCard>

        <MagicCard className={cn('p-6', kategori.bg)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mutu Pelayanan</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={cn('text-5xl font-bold leading-none', kategori.color)}>
                  {kategori.grade}
                </span>
                <Badge variant="secondary" className={kategori.color}>
                  {kategori.mutu}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Sesuai PermenPAN-RB 14/2017
              </p>
            </div>
            <Award className={cn('size-5', kategori.color)} aria-hidden />
          </div>
        </MagicCard>
      </div>

      {/* Baris 2: 4 aspek */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ASPEK_META.map(({ key, label, color }) => (
          <MagicCard key={key} className="p-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-2xl font-bold tabular-nums">
                <NumberTicker value={summary.rata_rata[key]} decimalPlaces={2} />
              </p>
              <span className="text-xs text-muted-foreground">/ 5.00</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (summary.rata_rata[key] / 5) * 100)}%`,
                  background: color,
                }}
              />
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  )
}

export function IkmLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Gauge className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">Skala IKM:</span>
      <Badge variant="outline" className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        D · 25–64,99
      </Badge>
      <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        C · 65–76,60
      </Badge>
      <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        B · 76,61–88,30
      </Badge>
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        A · 88,31–100
      </Badge>
    </div>
  )
}
