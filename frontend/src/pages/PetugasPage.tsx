import { useCallback, useEffect, useState } from 'react'
import { MoreHorizontal, Plus, QrCode } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PetugasFormDialog } from '@/components/petugas/PetugasFormDialog'
import { QrCodeDialog } from '@/components/petugas/QrCodeDialog'
import { deletePetugas, getAdminPetugas } from '@/lib/api'
import type { Petugas } from '@/types'

export default function PetugasPage() {
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [editTarget, setEditTarget] = useState<Petugas | null>(null)
  const [qrTarget, setQrTarget] = useState<Petugas | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Petugas | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daftar Petugas</h1>
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

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Loket</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {petugas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada petugas.
                </TableCell>
              </TableRow>
            ) : (
              petugas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={p.foto_url} alt={p.nama} />
                        <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{p.nama}</span>
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
                        <Button variant="ghost" size="icon">
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
                        {p.is_active === 1 && (
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(p)}
                            className="text-destructive"
                          >
                            Nonaktifkan
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <PetugasFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        petugas={editTarget}
        onSaved={fetchPetugas}
      />

      <QrCodeDialog open={!!qrTarget} onOpenChange={(o) => !o && setQrTarget(null)} petugas={qrTarget} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan petugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Petugas <strong>{deleteTarget?.nama}</strong> akan dinonaktifkan. Data survei tetap tersimpan.
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
