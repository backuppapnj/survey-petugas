import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, FileText, RefreshCw } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { BlurFade } from '@/components/ui/blur-fade'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { IkmLegend, SummaryCards } from '@/components/dashboard/SummaryCards'
import { RadarChartCard } from '@/components/dashboard/RadarChartCard'
import { BarChartCard } from '@/components/dashboard/BarChartCard'
import { RekapTable } from '@/components/dashboard/RekapTable'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { SaranList } from '@/components/dashboard/SaranList'
import { RatingDistribution } from '@/components/dashboard/RatingDistribution'
import { PetugasDetailDialog } from '@/components/dashboard/PetugasDetailDialog'
import { AnomaliPanel } from '@/components/dashboard/AnomaliPanel'
import { getAdminPetugas, getAnomali, getExportUrl, getRekap } from '@/lib/api'
import { categorizeIkm, hitungIkm } from '@/lib/ikm'
import type { AnomaliResponse, Petugas, RekapResponse, SurveiRecord } from '@/types'

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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedRangeKey, setLoadedRangeKey] = useState<string | null>(null)
  const latestRequestRef = useRef(0)
  const [anomali, setAnomali] = useState<AnomaliResponse | null>(null)
  const [anomaliLoading, setAnomaliLoading] = useState<boolean>(false)
  const [anomaliError, setAnomaliError] = useState<string | null>(null)
  const anomaliRequestRef = useRef(0)
  const activeRangeKey = `${start}:${end}`
  const hasValidDateRange = Boolean(start && end && start <= end)

  const fetchData = useCallback(
    async (showSpinner = true) => {
      if (!hasValidDateRange) {
        if (showSpinner) setLoading(false)
        else setRefreshing(false)
        return
      }

      const requestId = ++latestRequestRef.current
      const requestedRangeKey = activeRangeKey

      if (showSpinner) setLoading(true)
      else setRefreshing(true)
      try {
        const [r, list] = await Promise.all([getRekap(start, end), getAdminPetugas()])
        if (requestId !== latestRequestRef.current) return

        setRekap(r)
        setPetugasList(list)
        setLoadedRangeKey(requestedRangeKey)
        setLastUpdated(new Date())
        setLoadError(null)
      } catch {
        if (requestId !== latestRequestRef.current) return

        setLoadError('Gagal memuat dashboard. Periksa koneksi atau server, lalu coba lagi.')
        toast.error('Gagal memuat data rekap')
      } finally {
        if (requestId !== latestRequestRef.current) return

        setLoading(false)
        setRefreshing(false)
      }
    },
    [activeRangeKey, end, hasValidDateRange, start],
  )

  useEffect(() => {
    if (!hasValidDateRange) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(true)
  }, [fetchData, hasValidDateRange])

  // P3-24: polling ringan tiap 60 detik untuk menangkap data baru
  useEffect(() => {
    if (!hasValidDateRange) return
    const id = setInterval(() => fetchData(false), 60_000)
    return () => clearInterval(id)
  }, [fetchData, hasValidDateRange])

  // Ambil data anomali terpisah (non-blocking) agar timeout antrean tidak
  // menahan render dashboard utama. Race terbaru dimenangkan via requestRef.
  useEffect(() => {
    if (!hasValidDateRange) return
    const reqId = ++anomaliRequestRef.current
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnomaliLoading(true)
    setAnomaliError(null)
    getAnomali(start, end)
      .then((res) => {
        if (reqId === anomaliRequestRef.current) setAnomali(res)
      })
      .catch(() => {
        if (reqId === anomaliRequestRef.current) {
          setAnomaliError('Gagal memuat data anomali.')
        }
      })
      .finally(() => {
        if (reqId === anomaliRequestRef.current) setAnomaliLoading(false)
      })
  }, [start, end, hasValidDateRange])

  // P3-22: opsi unit kerja diturunkan dari daftar petugas
  const unitOptions = useMemo(() => {
    const set = new Set<string>()
    petugasList.forEach((p) => p.unit_kerja && set.add(p.unit_kerja))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))
  }, [petugasList])

  // Filter rekap by unit kerja jika dipilih
  const filteredRekap = useMemo<RekapResponse | null>(() => {
    if (!rekap || loadedRangeKey !== activeRangeKey) return null
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
  }, [activeRangeKey, loadedRangeKey, rekap, unitKerja, petugasList])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportUrl = new URL(getExportUrl(start, end), window.location.origin)
      if (unitKerja !== ALL_UNIT) {
        exportUrl.searchParams.set('unit_kerja', unitKerja)
      }
      const token = localStorage.getItem('token')
      const response = await fetch(exportUrl.toString(), {
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
  const hasVisibleSummary = Boolean(filteredRekap && summary)
  const visibleSummary = hasVisibleSummary ? summary : null
  const visibleRekap = hasVisibleSummary ? filteredRekap : null

  return (
    <div className="space-y-6">
      <PageHeader
        testId="dashboard-hero"
        titleTestId="dashboard-title-gradient"
        title="Dashboard IKM"
        description={
          <>
            Indeks Kepuasan Masyarakat — Survei Pelayanan Terpadu Satu Pintu
            {lastUpdated && (
              <>
                {' · '}
                <span title={lastUpdated.toLocaleString('id-ID')}>
                  Diperbarui {lastUpdated.toLocaleTimeString('id-ID')}
                </span>
              </>
            )}
          </>
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchData(false)}
              disabled={refreshing}
              title="Muat ulang data"
              className="tap-target"
            >
              <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
              <span className="sr-only">Muat ulang</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF}>
              <FileText className="mr-2 size-4" />
              Cetak PDF
            </Button>
          </>
        }
      />

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

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : loadError && !hasVisibleSummary ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-3xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 size-5 text-rose-600 dark:text-rose-400"
              aria-hidden
            />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-rose-700 dark:text-rose-300">
                Gagal memuat dashboard
              </h2>
              <p className="text-sm text-rose-700/85 dark:text-rose-300/85">{loadError}</p>
            </div>
          </div>
          <Button onClick={() => fetchData(true)} disabled={loading}>
            Coba lagi
          </Button>
        </div>
      ) : !hasVisibleSummary ? (
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
          {loadError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="mt-0.5 size-4 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                <span>{loadError}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
                Coba lagi
              </Button>
            </div>
          )}

          {visibleSummary && (
            <BlurFade delay={0.1}>
              <SummaryCards summary={visibleSummary} />
            </BlurFade>
          )}

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
              <TabsTrigger value="anomali">Anomali</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <motion.div
                data-testid="dashboard-tab-panel-overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <BlurFade delay={0.15}>
                    <RadarChartCard rataRata={visibleSummary!.rata_rata} />
                  </BlurFade>
                  <BlurFade delay={0.2}>
                    <BarChartCard
                      data={visibleRekap!.per_petugas}
                      onSelectPetugas={setDetailId}
                    />
                  </BlurFade>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="distribusi">
              <motion.div
                data-testid="dashboard-tab-panel-distribusi"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <RatingDistribution data={semua} />
              </motion.div>
            </TabsContent>

            <TabsContent value="saran">
              <motion.div
                data-testid="dashboard-tab-panel-saran"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <SaranList data={semua} petugas={petugasList} />
              </motion.div>
            </TabsContent>

            <TabsContent value="detail">
              <motion.div
                data-testid="dashboard-tab-panel-detail"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <RekapTable data={visibleRekap!.per_petugas} onSelectPetugas={setDetailId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="anomali">
              <motion.div
                data-testid="dashboard-tab-panel-anomali"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <AnomaliPanel data={anomali} loading={anomaliLoading} error={anomaliError} />
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Blok cetak: hanya muncul saat print */}
          {printOpen && kategori && (
            <PrintReport
              start={start}
              end={end}
              unitKerja={unitKerja === ALL_UNIT ? 'Semua Unit Kerja' : unitKerja}
              rekap={visibleRekap!}
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
    return avg < 2.5
  })
  if (lowSaran.length === 0) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900/40 dark:bg-rose-950/30">
      <Bell className="mt-0.5 size-4 text-rose-600 dark:text-rose-400" aria-hidden />
      <div>
        <p className="font-medium text-rose-700 dark:text-rose-300">
          {lowSaran.length} saran berasal dari rating rendah (rata-rata &lt; 2,5 dari 4)
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
