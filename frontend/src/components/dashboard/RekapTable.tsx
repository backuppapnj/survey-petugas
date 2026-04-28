import { useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { categorizeIkm, hitungIkm } from '@/lib/ikm'
import { cn } from '@/lib/utils'
import type { RekapPerPetugas } from '@/types'

interface Props {
  data: RekapPerPetugas[]
  onSelectPetugas?: (id: number) => void
}

type SortKey =
  | 'nama'
  | 'total_responden'
  | 'kecepatan'
  | 'keramahan'
  | 'informasi'
  | 'kenyamanan'
  | 'ikm'

type SortDir = 'asc' | 'desc'

export function RekapTable({ data, onSelectPetugas }: Props) {
  const [search, setSearch] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('ikm')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const enriched = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        ikm: hitungIkm(p.rata_rata),
      })),
    [data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched
      .filter((p) => !q || p.nama.toLowerCase().includes(q))
      .sort((a, b) => {
        const get = (r: typeof a): number | string => {
          switch (sortKey) {
            case 'nama':
              return r.nama.toLowerCase()
            case 'total_responden':
              return r.total_responden
            case 'ikm':
              return r.ikm
            default:
              return r.rata_rata[sortKey]
          }
        }
        const av = get(a)
        const bv = get(b)
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'id')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [enriched, search, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'nama' ? 'asc' : 'desc')
    }
  }

  // Helper (bukan komponen) supaya tidak melanggar react-hooks/static-components
  const sortHeader = (k: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={cn(
        'inline-flex w-full items-center gap-1 hover:text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {label}
      {sortKey === k &&
        (sortDir === 'asc' ? (
          <ArrowUpAZ className="size-3" aria-hidden />
        ) : (
          <ArrowDownAZ className="size-3" aria-hidden />
        ))}
    </button>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Detail per Petugas</CardTitle>
            <p className="text-xs text-muted-foreground">
              Rata-rata 4 aspek + nilai IKM &amp; mutu pelayanan setiap petugas.
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama petugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Cari di tabel rekap"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sortHeader('nama', 'Petugas')}</TableHead>
                <TableHead className="text-right">
                  {sortHeader('total_responden', 'Responden', 'right')}
                </TableHead>
                <TableHead className="text-right">
                  {sortHeader('kecepatan', 'Kecepatan', 'right')}
                </TableHead>
                <TableHead className="text-right">
                  {sortHeader('keramahan', 'Keramahan', 'right')}
                </TableHead>
                <TableHead className="text-right">
                  {sortHeader('informasi', 'Informasi', 'right')}
                </TableHead>
                <TableHead className="text-right">
                  {sortHeader('kenyamanan', 'Kenyamanan', 'right')}
                </TableHead>
                <TableHead className="text-right">{sortHeader('ikm', 'IKM', 'right')}</TableHead>
                <TableHead>Mutu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    {search ? 'Tidak ada petugas cocok.' : 'Belum ada data.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const kategori = categorizeIkm(p.ikm)
                  return (
                    <TableRow
                      key={p.petugas_id}
                      className={cn(onSelectPetugas && 'cursor-pointer hover:bg-muted/50')}
                      onClick={() => onSelectPetugas?.(p.petugas_id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage src={p.foto_url} alt={p.nama} />
                            <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{p.nama}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.total_responden}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.rata_rata.kecepatan.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.rata_rata.keramahan.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.rata_rata.informasi.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.rata_rata.kenyamanan.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {p.ikm.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={kategori.color}>
                          {kategori.grade} · {kategori.mutu}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
