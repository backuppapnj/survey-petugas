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
    <Card>
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
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--popover-foreground)',
                }}
                formatter={(v) => [Number(v ?? 0).toFixed(2), 'Skor']}
              />
              <Radar
                name="Rata-rata"
                dataKey="nilai"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
