import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BlurFade } from '@/components/ui/blur-fade'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { RadarChartCard } from '@/components/dashboard/RadarChartCard'
import { BarChartCard } from '@/components/dashboard/BarChartCard'
import { RekapTable } from '@/components/dashboard/RekapTable'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { getRekap, getExportUrl } from '@/lib/api'
import type { RekapResponse } from '@/types'

// Gunakan komponen lokal — toISOString() selalu UTC dan akan miss tanggal di WIB malam.
const today = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DashboardPage() {
  const [start, setStart] = useState<string>(today())
  const [end, setEnd] = useState<string>(today())
  const [rekap, setRekap] = useState<RekapResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    getRekap(start, end)
      .then(setRekap)
      .catch(() => toast.error('Gagal memuat data rekap'))
      .finally(() => setLoading(false))
  }, [start, end])

  const handleExport = async () => {
    try {
      const url = getExportUrl(start, end)
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Export gagal')

      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `laporan-ikm-${start}-${end}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast.error('Gagal mengunduh laporan')
    }
  }

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <h1 className="text-2xl font-bold">Dashboard IKM</h1>
      </BlurFade>

      <DateFilter
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onExport={handleExport}
      />

      {loading || !rekap ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <BlurFade delay={0.1}>
            <SummaryCards summary={rekap.summary} />
          </BlurFade>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BlurFade delay={0.15}>
              <RadarChartCard rataRata={rekap.summary.rata_rata} />
            </BlurFade>
            <BlurFade delay={0.2}>
              <BarChartCard data={rekap.per_petugas} />
            </BlurFade>
          </div>
          <BlurFade delay={0.25}>
            <RekapTable data={rekap.per_petugas} />
          </BlurFade>
        </>
      )}
    </div>
  )
}
