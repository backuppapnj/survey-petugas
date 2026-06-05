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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RekapPerPetugas } from '@/types'

interface BarChartCardProps {
  data: RekapPerPetugas[]
  onSelectPetugas?: (id: number) => void
}

const tooltipStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  color: '#e2e8f0',
  boxShadow: '0 20px 45px -28px rgba(15, 23, 42, 0.9)',
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
    <Card
      data-testid="bar-chart-card"
      data-gradient-ids="fillKecepatan,fillKeramahan,fillInformasi,fillKenyamanan"
      className="border border-blue-500/20 shadow-[0_18px_55px_-38px_rgba(37,99,235,0.55)]"
    >
      <CardHeader>
        <CardTitle>Perbandingan per Petugas</CardTitle>
        <p className="text-xs text-muted-foreground">
          {onSelectPetugas
            ? 'Pilih petugas dari tombol daftar di bawah grafik atau klik label grafik.'
            : 'Skor rata-rata 4 aspek per petugas.'}
        </p>
      </CardHeader>
      <CardContent className="flex min-h-80 flex-col gap-4">
        {chartData.length === 0 ? (
          <div className="flex min-h-64 flex-1 items-center justify-center text-sm text-muted-foreground">
            Belum ada data petugas pada periode ini.
          </div>
        ) : (
          <div className="min-h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 12, left: -8, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="fillKecepatan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.78} />
                  </linearGradient>
                  <linearGradient id="fillKeramahan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.78} />
                  </linearGradient>
                  <linearGradient id="fillInformasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.78} />
                  </linearGradient>
                  <linearGradient id="fillKenyamanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5eead4" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.78} />
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
                <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
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
          </div>
        )}
        {onSelectPetugas && chartData.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">Pilih petugas dari tombol daftar:</p>
            <div
              role="group"
              aria-label="Daftar petugas untuk detail"
              className="flex flex-wrap gap-2"
            >
              {chartData.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectPetugas(item.id)}
                >
                  Lihat detail {item.nama}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
