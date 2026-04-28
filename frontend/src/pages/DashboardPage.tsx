import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { BlurFade } from '@/components/ui/blur-fade'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IkmLegend, SummaryCards } from '@/components/dashboard/SummaryCards'
import { RadarChartCard } from '@/components/dashboard/RadarChartCard'
import { BarChartCard } from '@/components/dashboard/BarChartCard'
import { RekapTable } from '@/components/dashboard/RekapTable'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { SaranList } from '@/components/dashboard/SaranList'
import { RatingDistribution } from '@/components/dashboard/RatingDistribution'
import { PetugasDetailDialog } from '@/components/dashboard/PetugasDetailDialog'
import { getAdminPetugas, getExportUrl, getRekap } from '@/lib/api'
import { categorizeIkm, hitungIkm } from '@/lib/ikm'
import type { Petugas, RekapResponse, SurveiRecord } from '@/types'

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const last30Days = (): { start: string; end: string } => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return { start: fmt(start), end: fmt(end) }
}

const ALL_UNIT = '__all__'

export default function DashboardPage() {
  const init = last30Days()
  const [start, setStart] = useState<string>(init.start)
  const [end, setEnd] = useState<string>(init.end)
  const [unitKerja, setUnitKerja] = useState<string>(ALL_UNIT)

  const [rekap, setRekap] = useState<RekapResponse | null>(null)
  const [petugasList, setPetugasList] = useState<Petugas[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [exporting, setExporting] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [printOpen, setPrintOpen] = useState<boolean>(false)

  const fetchData = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true)
      else setRefreshing(true)
      try {
        const [r, list] = await Promise.all([getRekap(start, end), getAdminPetugas()])
        setRekap(r)
        setPetugasList(list)
        setLastUpdated(new Date())
      } catch {
        toast.error('Gagal memuat data rekap')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [start, end],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(true)
  }, [fetchData])

  // P3-24: polling ringan tiap 60 detik untuk menangkap data baru
  useEffect(() => {
    const id = setInterval(() => fetchData(false), 60_000)
    return () => clearInterval(id)
  }, [fetchData])

  // P3-22: opsi unit kerja diturunkan dari daftar petugas
  const unitOptions = useMemo(() => {
    const set = new Set<string>()
    petugasList.forEach((p) => p.unit_kerja && set.add(p.unit_kerja))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))
  }, [petugasList])

  // Filter rekap by unit kerja jika dipilih
  const filteredRekap = useMemo<RekapResponse | null>(() => {
    if (!rekap) return null
    if (unitKerja === ALL_UNIT) return rekap

    const idsInUnit = new Set(
      petugasList.filter((p) => p.unit_kerja === unitKerja).map((p) => p.id),
    )
    const per_petugas = rekap.per_petugas.filter((p) => idsInUnit.has(p.petugas_id))
    const semua = rekap.semua.filter((s) => idsInUnit.has(s.petugas_id))
    const total = semua.length
    const sum = semua.reduce(
      (acc, r) => ({
        kecepatan: acc.kecepatan + r.kecepatan,
        keramahan: acc.keramahan + r.keramahan,
        informasi: acc.informasi + r.informasi,
        kenyamanan: acc.kenyamanan + r.kenyamanan,
      }),
      { kecepatan: 0, keramahan: 0, informasi: 0, kenyamanan: 0 },
    )
    const rata = {
      kecepatan: total === 0 ? 0 : sum.kecepatan / total,
      keramahan: total === 0 ? 0 : sum.keramahan / total,
      informasi: total === 0 ? 0 : sum.informasi / total,
      kenyamanan: total === 0 ? 0 : sum.kenyamanan / total,
    }
    return {
      summary: {
        total_responden: total,
        rata_rata: rata,
        ikm: hitungIkm(rata),
      },
      per_petugas,
      semua,
    }
  }, [rekap, unitKerja, petugasList])

  const handleExport = async () => {
    setExporting(true)
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
      toast.success('Laporan Excel diunduh')
    } catch {
      toast.error('Gagal mengunduh laporan')
    } finally {
      setExporting(false)
    }
  }

  // P3-23: cetak/PDF via window.print() — bersih & tanpa dependensi tambahan.
  const handlePrintPDF = () => {
    setPrintOpen(true)
    // Beri waktu render `print:` styles
    setTimeout(() => {
      window.print()
      setPrintOpen(false)
    }, 200)
  }

  const summary = filteredRekap?.summary
  const kategori = summary ? categorizeIkm(summary.ikm) : null
  const semua: SurveiRecord[] = filteredRekap?.semua ?? []

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard IKM</h1>
            <p className="text-sm text-muted-foreground">
              Indeks Kepuasan Masyarakat — Survei Pelayanan Terpadu Satu Pintu
              {lastUpdated && (
                <>
                  {' · '}
                  <span title={lastUpdated.toLocaleString('id-ID')}>
                    Diperbarui {lastUpdated.toLocaleTimeString('id-ID')}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchData(false)}
              disabled={refreshing}
              title="Muat ulang data"
            >
              <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
              <span className="sr-only">Muat ulang</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF}>
              <FileText className="mr-2 size-4" />
              Cetak PDF
            </Button>
          </div>
        </div>
      </BlurFade>

      <DateFilter
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onExport={handleExport}
        exporting={exporting}
        unitKerja={unitKerja}
        onUnitKerjaChange={setUnitKerja}
        unitOptions={unitOptions}
      />

      {loading || !filteredRekap || !summary ? (
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
            <SummaryCards summary={summary} />
          </BlurFade>

          <BlurFade delay={0.12}>
            <IkmLegend />
          </BlurFade>

          {/* P3-24 banner peringatan jika ada respon rating rendah */}
          <LowRatingBanner records={semua} />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Ringkasan</TabsTrigger>
              <TabsTrigger value="distribusi">Distribusi Rating</TabsTrigger>
              <TabsTrigger value="saran">
                Saran ({semua.filter((s) => s.saran && s.saran.trim().length > 0).length})
              </TabsTrigger>
              <TabsTrigger value="detail">Tabel Detail</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BlurFade delay={0.15}>
                  <RadarChartCard rataRata={summary.rata_rata} />
                </BlurFade>
                <BlurFade delay={0.2}>
                  <BarChartCard
                    data={filteredRekap.per_petugas}
                    onSelectPetugas={setDetailId}
                  />
                </BlurFade>
              </div>
            </TabsContent>

            <TabsContent value="distribusi">
              <RatingDistribution data={semua} />
            </TabsContent>

            <TabsContent value="saran">
              <SaranList data={semua} petugas={petugasList} />
            </TabsContent>

            <TabsContent value="detail">
              <RekapTable data={filteredRekap.per_petugas} onSelectPetugas={setDetailId} />
            </TabsContent>
          </Tabs>

          {/* Blok cetak: hanya muncul saat print */}
          {printOpen && kategori && (
            <PrintReport
              start={start}
              end={end}
              unitKerja={unitKerja === ALL_UNIT ? 'Semua Unit Kerja' : unitKerja}
              rekap={filteredRekap}
            />
          )}
        </>
      )}

      <PetugasDetailDialog
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
        petugasId={detailId}
        perPetugas={filteredRekap?.per_petugas ?? []}
        semua={filteredRekap?.semua ?? []}
        petugas={petugasList}
      />
    </div>
  )
}

/* P3-24: peringatan saran rating rendah (≥1 respon di periode) */
function LowRatingBanner({ records }: { records: SurveiRecord[] }) {
  const lowSaran = records.filter((r) => {
    if (!r.saran || r.saran.trim().length === 0) return false
    const avg = (r.kecepatan + r.keramahan + r.informasi + r.kenyamanan) / 4
    return avg < 3
  })
  if (lowSaran.length === 0) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900/40 dark:bg-rose-950/30">
      <Bell className="mt-0.5 size-4 text-rose-600 dark:text-rose-400" aria-hidden />
      <div>
        <p className="font-medium text-rose-700 dark:text-rose-300">
          {lowSaran.length} saran berasal dari rating sangat rendah (&lt;3 bintang)
        </p>
        <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
          Buka tab <strong>Saran</strong> untuk meninjau dan menindaklanjuti.
        </p>
      </div>
    </div>
  )
}

/* P3-23: blok print-only laporan resmi */
function PrintReport({
  start,
  end,
  unitKerja,
  rekap,
}: {
  start: string
  end: string
  unitKerja: string
  rekap: RekapResponse
}) {
  const k = categorizeIkm(rekap.summary.ikm)
  return (
    <div className="hidden print:block">
      <h1 className="text-2xl font-bold">Laporan Indeks Kepuasan Masyarakat</h1>
      <p className="text-sm">
        Periode: {start} s.d. {end} · Unit: {unitKerja}
      </p>
      <p className="mt-4 text-base">
        Total responden: <strong>{rekap.summary.total_responden}</strong>
      </p>
      <p className="text-base">
        Nilai IKM: <strong>{rekap.summary.ikm.toFixed(2)}</strong> · Mutu: <strong>{k.grade} ({k.mutu})</strong>
      </p>
      <h2 className="mt-4 text-lg font-semibold">Rincian per Petugas</h2>
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border p-1 text-left">Nama</th>
            <th className="border p-1">Resp.</th>
            <th className="border p-1">Kec.</th>
            <th className="border p-1">Ram.</th>
            <th className="border p-1">Inf.</th>
            <th className="border p-1">Nyam.</th>
            <th className="border p-1">IKM</th>
            <th className="border p-1">Mutu</th>
          </tr>
        </thead>
        <tbody>
          {rekap.per_petugas.map((p) => {
            const ikm = hitungIkm(p.rata_rata)
            const kk = categorizeIkm(ikm)
            return (
              <tr key={p.petugas_id}>
                <td className="border p-1">{p.nama}</td>
                <td className="border p-1 text-right">{p.total_responden}</td>
                <td className="border p-1 text-right">{p.rata_rata.kecepatan.toFixed(2)}</td>
                <td className="border p-1 text-right">{p.rata_rata.keramahan.toFixed(2)}</td>
                <td className="border p-1 text-right">{p.rata_rata.informasi.toFixed(2)}</td>
                <td className="border p-1 text-right">{p.rata_rata.kenyamanan.toFixed(2)}</td>
                <td className="border p-1 text-right">{ikm.toFixed(2)}</td>
                <td className="border p-1">{kk.grade} · {kk.mutu}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-6 text-xs">Dicetak {new Date().toLocaleString('id-ID')}</p>
    </div>
  )
}
