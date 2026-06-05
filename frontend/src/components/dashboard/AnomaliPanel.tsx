import type { ReactNode } from 'react'
import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AnomaliResponse } from '@/types'

interface AnomaliPanelProps {
  data: AnomaliResponse | null
  loading: boolean
  error: string | null
}

/** Kartu ringkasan satu sinyal anomali. */
function SummaryChip({
  icon,
  label,
  value,
  testId,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number
  testId: string
  tone: 'rose' | 'amber' | 'sky'
}) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
        : 'border-sky-200 bg-sky-50/80 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${toneClass}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none" data-testid={testId}>
          {value}
        </p>
        <p className="text-xs">{label}</p>
      </div>
    </div>
  )
}

export function AnomaliPanel({ data, loading, error }: AnomaliPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4" data-testid="anomali-loading">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
      >
        <AlertTriangle className="mt-0.5 size-4" aria-hidden />
        <span>{error}</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Belum ada data anomali untuk periode ini.
      </div>
    )
  }

  const jumlahAnomaliHarian = data.harian.items.filter((d) => d.anomali).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryChip
          icon={<Clock className="size-6" aria-hidden />}
          label="Submit di luar jam layanan"
          value={data.luar_jam.total}
          testId="anomali-luar-jam-total"
          tone="amber"
        />
        <SummaryChip
          icon={<AlertTriangle className="size-6" aria-hidden />}
          label="Tanggal survei > tamu dilayani"
          value={jumlahAnomaliHarian}
          testId="anomali-harian-total"
          tone="rose"
        />
        <SummaryChip
          icon={<TrendingUp className="size-6" aria-hidden />}
          label="Petugas outlier"
          value={data.petugas_outlier.items.length}
          testId="anomali-outlier-total"
          tone="sky"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" aria-hidden />
            Survei vs Tamu Dilayani (harian)
          </CardTitle>
          {!data.harian.antrean_tersedia && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Data antrean tidak tersedia — sinyal ini dinonaktifkan. Menampilkan
              jumlah survei harian saja.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table aria-label="Survei vs tamu dilayani harian" className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="p-2">Tanggal</th>
                  <th scope="col" className="p-2 text-right">Survei</th>
                  <th scope="col" className="p-2 text-right">Dilayani</th>
                  <th scope="col" className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.harian.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      Tidak ada data pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.harian.items.map((row) => (
                    <tr
                      key={row.date}
                      className={
                        row.anomali
                          ? 'border-b bg-rose-50/60 dark:bg-rose-950/20'
                          : 'border-b'
                      }
                    >
                      <td className="p-2 font-medium">{row.date}</td>
                      <td className="p-2 text-right">{row.survei}</td>
                      <td className="p-2 text-right">
                        {data.harian.antrean_tersedia ? row.dilayani : '—'}
                      </td>
                      <td className="p-2">
                        {row.anomali ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            <AlertTriangle className="size-3" aria-hidden />
                            Anomali
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Petugas Outlier (median {data.petugas_outlier.median})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.petugas_outlier.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada petugas dengan jumlah survei yang mencurigakan.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.petugas_outlier.items.map((p) => (
                  <li
                    key={p.petugas_id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <span className="font-medium">{p.nama}</span>
                    <span className="text-muted-foreground">
                      {p.jumlah} survei · {p.rasio}× median
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Submit di Luar Jam ({data.luar_jam.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.luar_jam.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Semua submit berada dalam jam layanan.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {/* idx tiebreaker: dua submission petugas sama bisa beda baris namun created_at identik */}
                {data.luar_jam.items.map((item, idx) => (
                  <li
                    key={`${item.petugas_id}-${item.created_at}-${idx}`}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <span className="font-medium">{item.nama}</span>
                    <span className="text-muted-foreground">{item.created_at}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
