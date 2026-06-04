import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RekapPerPetugas } from '@/types'

interface BarChartCardProps {
  data: RekapPerPetugas[]
  onSelectPetugas?: (id: number) => void
}

const tooltipStyle: React.CSSProperties = {
  background: 'hsl(222.2,84%,4.9%)',
  border: '1px solid hsl(215,20%,15%)',
  borderRadius: 8,
  color: 'hsl(210,40%,96.1%)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
}

export function BarChartCard({ data, onSelectPetugas }: BarChartCardProps) {
  const chartData = data.map((p) => ({
    id: p.petugas_id,
    nama: p.nama,
    Kecepatan: Number(p.rata_rata.kecepatan.toFixed(2)),
    Keramahan: Number(p.rata_rata.keramahan.toFixed(2)),
    Informasi: Number(p.rata_rata.informasi.toFixed(2)),
    Kenyamanan: Number(p.rata_rata.kenyamanan.toFixed(2)),
  }))

  return (
    <Card className="border-blue-200/50 dark:border-blue-800/30">
      <CardHeader>
        <CardTitle>Perbandingan per Petugas</CardTitle>
        <p className="text-xs text-muted-foreground">
          {onSelectPetugas
            ? 'Klik nama petugas untuk melihat detail.'
            : 'Skor rata-rata 4 aspek per petugas.'}
        </p>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Belum ada data petugas pada periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -8, bottom: 40 }}
            >
              <defs>
                <linearGradient id="fillKecepatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="fillKeramahan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="fillInformasi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="fillKenyamanan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="nama"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11, cursor: onSelectPetugas ? 'pointer' : 'default' }}
                onClick={(e: { value?: string }) => {
                  if (!onSelectPetugas) return
                  const found = chartData.find((d) => d.nama === e.value)
                  if (found) onSelectPetugas(found.id)
                }}
              />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--accent)', opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
              <Bar dataKey="Kecepatan" fill="url(#fillKecepatan)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Keramahan" fill="url(#fillKeramahan)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Informasi" fill="url(#fillInformasi)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Kenyamanan" fill="url(#fillKenyamanan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
