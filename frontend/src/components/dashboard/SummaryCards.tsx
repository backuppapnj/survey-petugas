import { MagicCard } from '@/components/ui/magic-card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import type { RekapSummary } from '@/types'

export function SummaryCards({ summary }: { summary: RekapSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">Total Responden</p>
        <p className="text-3xl font-bold">
          <NumberTicker value={summary.total_responden} />
        </p>
      </MagicCard>

      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">IKM</p>
        <div className="mt-2 flex items-center justify-center">
          <AnimatedCircularProgressBar
            max={100}
            value={summary.ikm}
            min={0}
            gaugePrimaryColor="hsl(var(--primary))"
            gaugeSecondaryColor="hsl(var(--muted))"
          />
        </div>
      </MagicCard>

      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">Rata Kecepatan</p>
        <p className="text-3xl font-bold">
          <NumberTicker value={summary.rata_rata.kecepatan} decimalPlaces={2} />
        </p>
      </MagicCard>

      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">Rata Keramahan</p>
        <p className="text-3xl font-bold">
          <NumberTicker value={summary.rata_rata.keramahan} decimalPlaces={2} />
        </p>
      </MagicCard>
    </div>
  )
}
