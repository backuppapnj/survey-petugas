import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  UserX,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PetugasFormDialog } from '@/components/petugas/PetugasFormDialog'
import { QrCodeDialog } from '@/components/petugas/QrCodeDialog'
import { deletePetugas, getAdminPetugas, restorePetugas } from '@/lib/api'
import type { Petugas } from '@/types'

type StatusFilter = 'all' | 'active' | 'inactive'
type SortKey = 'nama' | 'loket' | 'unit_kerja'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

export default function PetugasPage() {
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [editTarget, setEditTarget] = useState<Petugas | null>(null)
  const [qrTarget, setQrTarget] = useState<Petugas | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Petugas | null>(null)

  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('nama')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState<number>(1)

  const fetchPetugas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminPetugas()
      setPetugas(data)
    } catch {
      toast.error('Gagal memuat daftar petugas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPetugas()
  }, [fetchPetugas])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePetugas(deleteTarget.id)
      toast.success('Petugas berhasil dinonaktifkan')
      setDeleteTarget(null)
      fetchPetugas()
    } catch {
      toast.error('Gagal menonaktifkan petugas')
    }
  }

  const handleRestore = async (p: Petugas) => {
    try {
      await restorePetugas(p.id)
      toast.success(`Petugas ${p.nama} diaktifkan kembali`)
      fetchPetugas()
    } catch {
      toast.error('Gagal mengaktifkan petugas')
    }
  }

  // Filter + sort + paginate (client-side karena dataset kecil)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return petugas
      .filter((p) => {
        if (statusFilter === 'active' && !p.is_active) return false
        if (statusFilter === 'inactive' && p.is_active) return false
        if (!q) return true
        return (
          p.nama.toLowerCase().includes(q) ||
          p.loket.toLowerCase().includes(q) ||
          p.unit_kerja.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? '').toString().toLowerCase()
        const bv = (b[sortKey] ?? '').toString().toLowerCase()
        const cmp = av.localeCompare(bv, 'id')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [petugas, search, statusFilter, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  // Reset ke halaman 1 saat filter/search berubah
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search, statusFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Helper (bukan komponen) untuk header tabel yang dapat disort
  const sortHeader = (k: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-foreground"
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

  const totalAktif = petugas.filter((p) => !!p.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Petugas</h1>
          <p className="text-sm text-muted-foreground">
            {totalAktif} aktif · {petugas.length - totalAktif} non-aktif · {petugas.length} total
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Tambah Petugas
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, loket, atau unit kerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Cari petugas"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full md:w-44" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Hanya Aktif</SelectItem>
            <SelectItem value="inactive">Hanya Non-aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          hasFilter={!!search || statusFilter !== 'all'}
          onClear={() => {
            setSearch('')
            setStatusFilter('all')
          }}
          onAdd={() => {
            setEditTarget(null)
            setFormOpen(true)
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{sortHeader('nama', 'Nama')}</TableHead>
                  <TableHead>{sortHeader('loket', 'Loket')}</TableHead>
                  <TableHead>{sortHeader('unit_kerja', 'Unit Kerja')}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={p.foto_url} alt={p.nama} />
                          <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{p.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.loket}</TableCell>
                    <TableCell>{p.unit_kerja}</TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge>Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Non-aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${p.nama}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditTarget(p)
                              setFormOpen(true)
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrTarget(p)}>
                            <QrCode className="mr-2 size-4" />
                            Lihat QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {p.is_active ? (
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(p)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="mr-2 size-4" />
                              Nonaktifkan
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRestore(p)}>
                              <RotateCcw className="mr-2 size-4" />
                              Aktifkan kembali
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Menampilkan {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari{' '}
                {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="size-4" />
                  <span className="sr-only">Sebelumnya</span>
                </Button>
                <span className="tabular-nums text-muted-foreground">
                  {safePage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={safePage === pageCount}
                >
                  <ChevronRight className="size-4" />
                  <span className="sr-only">Selanjutnya</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <PetugasFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        petugas={editTarget}
        onSaved={fetchPetugas}
      />

      <QrCodeDialog
        open={!!qrTarget}
        onOpenChange={(o) => !o && setQrTarget(null)}
        petugas={qrTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan petugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Petugas <strong>{deleteTarget?.nama}</strong> akan dinonaktifkan dan tidak akan
              tampil pada halaman survei publik. Data survei sebelumnya tetap tersimpan dan dapat
              diaktifkan kembali kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Nonaktifkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({
  hasFilter,
  onClear,
  onAdd,
}: {
  hasFilter: boolean
  onClear: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <Users className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <h2 className="text-base font-semibold">
          {hasFilter ? 'Tidak ada petugas yang cocok' : 'Belum ada petugas'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilter
            ? 'Coba ubah kata kunci pencarian atau filter status.'
            : 'Mulai dengan menambahkan petugas pertama untuk membuat QR survei.'}
        </p>
      </div>
      {hasFilter ? (
        <Button variant="outline" onClick={onClear}>
          Reset filter
        </Button>
      ) : (
        <Button onClick={onAdd}>
          <Plus className="mr-2 size-4" />
          Tambah Petugas
        </Button>
      )}
    </div>
  )
}
