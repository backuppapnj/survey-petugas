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

export function BarChartCard({ data }: { data: RekapPerPetugas[] }) {
  // Petakan data petugas ke struktur yang sesuai untuk BarChart
  const chartData = data.map((p) => ({
    nama: p.nama,
    Kecepatan: p.rata_rata.kecepatan,
    Keramahan: p.rata_rata.keramahan,
    Informasi: p.rata_rata.informasi,
    Kenyamanan: p.rata_rata.kenyamanan,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan per Petugas</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nama" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Kecepatan" fill="hsl(var(--chart-1))" />
            <Bar dataKey="Keramahan" fill="hsl(var(--chart-2))" />
            <Bar dataKey="Informasi" fill="hsl(var(--chart-3))" />
            <Bar dataKey="Kenyamanan" fill="hsl(var(--chart-4))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
