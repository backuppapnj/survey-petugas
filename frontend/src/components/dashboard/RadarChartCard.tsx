import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RataRata } from '@/types'

export function RadarChartCard({ rataRata }: { rataRata: RataRata }) {
  // Susun data untuk radar chart per aspek
  const data = [
    { aspek: 'Kecepatan', nilai: rataRata.kecepatan },
    { aspek: 'Keramahan', nilai: rataRata.keramahan },
    { aspek: 'Informasi', nilai: rataRata.informasi },
    { aspek: 'Kenyamanan', nilai: rataRata.kenyamanan },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Rata-rata Aspek</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="aspek" />
            <Radar
              dataKey="nilai"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
