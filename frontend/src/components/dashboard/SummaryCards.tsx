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
  borderColor: string
  gradientFrom: string
  gradientTo: string
  labelColor: string
}> = [
  { key: 'kecepatan', label: 'Kecepatan', color: 'var(--chart-1)', borderColor: 'border-l-blue-500', gradientFrom: 'from-blue-500', gradientTo: 'to-blue-400', labelColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'keramahan', label: 'Keramahan', color: 'var(--chart-2)', borderColor: 'border-l-emerald-500', gradientFrom: 'from-emerald-500', gradientTo: 'to-emerald-400', labelColor: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'informasi', label: 'Informasi', color: 'var(--chart-3)', borderColor: 'border-l-amber-500', gradientFrom: 'from-amber-500', gradientTo: 'to-amber-400', labelColor: 'text-amber-600 dark:text-amber-400' },
  { key: 'kenyamanan', label: 'Kenyamanan', color: 'var(--chart-4)', borderColor: 'border-l-violet-500', gradientFrom: 'from-violet-500', gradientTo: 'to-violet-400', labelColor: 'text-violet-600 dark:text-violet-400' },
]

export function SummaryCards({ summary }: { summary: RekapSummary }) {
  const kategori = categorizeIkm(summary.ikm)

  return (
    <div className="space-y-4">
      {/* Baris 1: Headline metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MagicCard className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 p-6 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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

        <MagicCard className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 p-6 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-4">
            <AnimatedCircularProgressBar
              max={100}
              value={summary.ikm}
              min={0}
              gaugePrimaryColor="hsl(142,71%,45%)"
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

        <MagicCard className={cn('bg-gradient-to-br from-emerald-50 to-green-100/50 border-emerald-200 p-6 dark:from-emerald-950/30 dark:to-green-900/20 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200', kategori.bg)}>
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
        {ASPEK_META.map(({ key, label, color, borderColor, labelColor }, index) => (
          <MagicCard
            key={key}
            className={cn('p-4 border-l-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 rounded-none rounded-r-xl', borderColor)}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              <p className={cn('text-xs font-semibold', labelColor)}>{label}</p>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-2xl font-bold tabular-nums">
                <NumberTicker value={summary.rata_rata[key]} decimalPlaces={2} />
              </p>
              <span className="text-xs text-muted-foreground">/ 5.00</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, (summary.rata_rata[key] / 5) * 100)}%`,
                  backgroundImage: `linear-gradient(to right, var(--chart-${index + 1}), color-mix(in oklch, var(--chart-${index + 1}) 70%, white))`,
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
