import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RataRata } from '@/types'

export function RadarChartCard({ rataRata }: { rataRata: RataRata }) {
  const data = [
    { aspek: 'Kecepatan', nilai: Number(rataRata.kecepatan.toFixed(2)) },
    { aspek: 'Keramahan', nilai: Number(rataRata.keramahan.toFixed(2)) },
    { aspek: 'Informasi', nilai: Number(rataRata.informasi.toFixed(2)) },
    { aspek: 'Kenyamanan', nilai: Number(rataRata.kenyamanan.toFixed(2)) },
  ]

  const isEmpty = data.every((d) => d.nilai === 0)

  return (
    <Card
      data-testid="radar-chart-card"
      className="border border-blue-500/20 shadow-[0_18px_55px_-38px_rgba(37,99,235,0.55)]"
    >
      <CardHeader>
        <CardTitle>Profil Rata-rata Aspek</CardTitle>
        <p className="text-xs text-muted-foreground">
          Skor 4 aspek pelayanan pada skala 1–5.
        </p>
      </CardHeader>
      <CardContent className="h-72">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Belum ada data untuk periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="aspek" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis
                domain={[0, 5]}
                tick={{ fontSize: 10 }}
                tickCount={6}
                stroke="var(--border)"
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  boxShadow: '0 20px 45px -28px rgba(15, 23, 42, 0.9)',
                }}
                formatter={(v) => [Number(v ?? 0).toFixed(2), 'Skor']}
              />
              <Radar
                name="Rata-rata"
                dataKey="nilai"
                stroke="hsl(142,71%,45%)"
                fill="hsl(142,71%,45%)"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
