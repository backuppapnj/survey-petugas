import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Image as ImageIcon, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPetugas, updatePetugas } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApiError, Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas?: Petugas | null
  onSaved: () => void
}

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB sesuai validasi backend
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const NAMA_MAX = 100
const LOKET_MAX = 50
const UNIT_MAX = 100

export function PetugasFormDialog({ open, onOpenChange, petugas, onSaved }: Props) {
  const [nama, setNama] = useState<string>('')
  const [loket, setLoket] = useState<string>('')
  const [unitKerja, setUnitKerja] = useState<string>('')
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [previewIsBlob, setPreviewIsBlob] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!petugas

  // Reset state ketika dialog dibuka / target berubah — pattern controlled-form sync
  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setNama(petugas?.nama ?? '')
    setLoket(petugas?.loket ?? '')
    setUnitKerja(petugas?.unit_kerja ?? '')
    setFoto(null)
    setPreview(petugas?.foto_url ?? '')
    setPreviewIsBlob(false)
    setErrors({})
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, petugas])

  // Cleanup object URL ketika preview blob berubah / dialog ditutup
  useEffect(() => {
    return () => {
      if (previewIsBlob && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview, previewIsBlob])

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Format foto harus JPG atau PNG')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(
        `Ukuran foto maksimal 2 MB (file ini ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      )
      e.target.value = ''
      return
    }

    // Bersihkan preview blob lama
    if (previewIsBlob && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setFoto(file)
    setPreview(URL.createObjectURL(file))
    setPreviewIsBlob(true)
  }

  const removeFoto = () => {
    if (previewIsBlob && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setFoto(null)
    setPreview(petugas?.foto_url ?? '')
    setPreviewIsBlob(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!nama.trim()) next.nama = 'Nama wajib diisi'
    else if (nama.length > NAMA_MAX) next.nama = `Maksimal ${NAMA_MAX} karakter`
    if (!loket.trim()) next.loket = 'Loket wajib diisi'
    else if (loket.length > LOKET_MAX) next.loket = `Maksimal ${LOKET_MAX} karakter`
    if (!unitKerja.trim()) next.unit_kerja = 'Unit kerja wajib diisi'
    else if (unitKerja.length > UNIT_MAX) next.unit_kerja = `Maksimal ${UNIT_MAX} karakter`
    if (!isEdit && !foto) next.foto = 'Foto wajib diunggah'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Lengkapi data yang ditandai')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nama', nama.trim())
      formData.append('loket', loket.trim())
      formData.append('unit_kerja', unitKerja.trim())
      if (foto) formData.append('foto', foto)

      if (isEdit && petugas) {
        await updatePetugas(petugas.id, formData)
        toast.success('Petugas berhasil diperbarui')
      } else {
        await createPetugas(formData)
        toast.success('Petugas berhasil ditambahkan')
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      const axErr = err as AxiosError<ApiError>
      const apiMsgs = axErr.response?.data?.messages
      if (apiMsgs && typeof apiMsgs === 'object') {
        setErrors(apiMsgs)
      }
      toast.error(
        axErr.response?.data?.error ??
          (isEdit ? 'Gagal memperbarui petugas' : 'Gagal menambahkan petugas'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Petugas' : 'Tambah Petugas'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui data petugas. Foto opsional jika tidak ingin diganti.'
              : 'Lengkapi data petugas baru. Foto akan tampil di halaman survei publik.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src={preview} alt="Pratinjau" />
              <AvatarFallback>
                <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="foto">Foto {isEdit && '(opsional)'}</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 size-4" />
                  {foto ? 'Ganti foto' : 'Pilih foto'}
                </Button>
                {foto && (
                  <Button type="button" variant="ghost" size="sm" onClick={removeFoto}>
                    <X className="mr-1 size-4" />
                    Batal
                  </Button>
                )}
              </div>
              <Input
                id="foto"
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFile}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                JPG atau PNG, maksimal 2 MB
              </p>
              {errors.foto && <p className="text-xs text-destructive">{errors.foto}</p>}
            </div>
          </div>

          {/* Nama */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="nama">Nama</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {nama.length} / {NAMA_MAX}
              </span>
            </div>
            <Input
              id="nama"
              value={nama}
              maxLength={NAMA_MAX}
              onChange={(e) => setNama(e.target.value)}
              required
              aria-invalid={!!errors.nama}
              className={cn(errors.nama && 'border-destructive')}
            />
            {errors.nama && <p className="text-xs text-destructive">{errors.nama}</p>}
          </div>

          {/* Loket */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="loket">Loket</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {loket.length} / {LOKET_MAX}
              </span>
            </div>
            <Input
              id="loket"
              value={loket}
              maxLength={LOKET_MAX}
              onChange={(e) => setLoket(e.target.value)}
              required
              placeholder="Contoh: Loket 1"
              aria-invalid={!!errors.loket}
              className={cn(errors.loket && 'border-destructive')}
            />
            {errors.loket && <p className="text-xs text-destructive">{errors.loket}</p>}
          </div>

          {/* Unit Kerja */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="unit_kerja">Unit Kerja</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {unitKerja.length} / {UNIT_MAX}
              </span>
            </div>
            <Input
              id="unit_kerja"
              value={unitKerja}
              maxLength={UNIT_MAX}
              onChange={(e) => setUnitKerja(e.target.value)}
              required
              placeholder="Contoh: Pelayanan Umum"
              aria-invalid={!!errors.unit_kerja}
              className={cn(errors.unit_kerja && 'border-destructive')}
            />
            {errors.unit_kerja && (
              <p className="text-xs text-destructive">{errors.unit_kerja}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Petugas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
