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
  borderClass: string
  gradientFrom: string
  gradientTo: string
  labelClass: string
}> = [
  {
    key: 'kecepatan',
    label: 'Kecepatan',
    color: 'var(--chart-1)',
    borderClass: 'border-sky-400/80',
    gradientFrom: 'rgba(14, 165, 233, 0.95)',
    gradientTo: 'rgba(34, 211, 238, 0.82)',
    labelClass: 'text-sky-700 dark:text-sky-300',
  },
  {
    key: 'keramahan',
    label: 'Keramahan',
    color: 'var(--chart-2)',
    borderClass: 'border-emerald-400/80',
    gradientFrom: 'rgba(16, 185, 129, 0.95)',
    gradientTo: 'rgba(45, 212, 191, 0.82)',
    labelClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'informasi',
    label: 'Informasi',
    color: 'var(--chart-3)',
    borderClass: 'border-blue-400/80',
    gradientFrom: 'rgba(59, 130, 246, 0.95)',
    gradientTo: 'rgba(56, 189, 248, 0.82)',
    labelClass: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'kenyamanan',
    label: 'Kenyamanan',
    color: 'var(--chart-4)',
    borderClass: 'border-teal-300/80',
    gradientFrom: 'rgba(45, 212, 191, 0.95)',
    gradientTo: 'rgba(16, 185, 129, 0.82)',
    labelClass: 'text-teal-700 dark:text-teal-300',
  },
]

export function SummaryCards({ summary }: { summary: RekapSummary }) {
  const kategori = categorizeIkm(summary.ikm)
  const ikmGaugeColor = 'hsl(142,71%,45%)'

  return (
    <div className="space-y-4">
      {/* Baris 1: Headline metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          data-testid="summary-total-card"
          className="border border-sky-500/20 bg-gradient-to-br from-sky-500/20 via-background to-cyan-500/10 p-6 shadow-[0_16px_48px_-28px_rgba(14,165,233,0.55)]"
        >
          <MagicCard className="h-full p-6" gradientFrom="#38bdf8" gradientTo="#22d3ee">
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
              <Users className="size-5 text-sky-500/80" aria-hidden />
            </div>
          </MagicCard>
        </div>

        <div
          data-testid="summary-ikm-card"
          className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/18 via-background to-sky-500/10 p-6 shadow-[0_16px_48px_-28px_rgba(16,185,129,0.5)]"
        >
          <MagicCard className="h-full p-6" gradientFrom="#34d399" gradientTo="#38bdf8">
            <div className="flex items-center gap-4">
              <div
                data-testid="summary-ikm-progress"
                data-gauge-primary={ikmGaugeColor}
                className="rounded-full bg-emerald-500/8 p-1"
              >
                <AnimatedCircularProgressBar
                  max={100}
                  value={summary.ikm}
                  min={0}
                  gaugePrimaryColor={ikmGaugeColor}
                  gaugeSecondaryColor="var(--muted)"
                  className="size-24 text-base"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nilai IKM</p>
                <p className="text-3xl font-bold tabular-nums">
                  <NumberTicker value={summary.ikm} decimalPlaces={2} />
                </p>
                <p className="text-xs text-muted-foreground">Skala 25–100</p>
              </div>
            </div>
          </MagicCard>
        </div>

        <MagicCard
          className={cn(
            'border border-blue-500/20 bg-gradient-to-br from-blue-500/16 via-background to-emerald-500/12 p-6 shadow-[0_16px_48px_-28px_rgba(59,130,246,0.5)]',
            kategori.bg,
          )}
          gradientFrom="#60a5fa"
          gradientTo="#34d399"
        >
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
        {ASPEK_META.map(({ key, label, color, borderClass, gradientFrom, gradientTo, labelClass }) => (
          <div
            key={key}
            data-testid={`summary-aspek-${key}`}
            className={cn(
              'border-l-4 bg-gradient-to-br from-background via-background to-slate-50/60 p-4 dark:to-slate-950/30',
              borderClass,
            )}
          >
            <MagicCard className="h-full p-4" gradientFrom={gradientFrom} gradientTo={gradientTo}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: color }}
                  aria-hidden
                />
                <p className={cn('text-xs font-medium', labelClass)}>
                  {label}
                </p>
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
                    backgroundImage: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
                  }}
                />
              </div>
            </MagicCard>
          </div>
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
