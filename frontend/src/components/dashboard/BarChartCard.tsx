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
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--popover-foreground)',
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
    <Card>
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Kecepatan" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Keramahan" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Informasi" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Kenyamanan" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
