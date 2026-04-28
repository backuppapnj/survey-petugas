import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPetugas, updatePetugas } from '@/lib/api'
import type { Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas?: Petugas | null
  onSaved: () => void
}

export function PetugasFormDialog({ open, onOpenChange, petugas, onSaved }: Props) {
  const [nama, setNama] = useState<string>('')
  const [loket, setLoket] = useState<string>('')
  const [unitKerja, setUnitKerja] = useState<string>('')
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const isEdit = !!petugas

  useEffect(() => {
    if (open) {
      // Reset form sesuai mode (edit/tambah)
      setNama(petugas?.nama ?? '')
      setLoket(petugas?.loket ?? '')
      setUnitKerja(petugas?.unit_kerja ?? '')
      setFoto(null)
      setPreview(petugas?.foto_url ?? '')
    }
  }, [open, petugas])

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Foto wajib saat membuat petugas baru
    if (!isEdit && !foto) {
      toast.error('Foto wajib diunggah')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nama', nama)
      formData.append('loket', loket)
      formData.append('unit_kerja', unitKerja)
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
    } catch {
      toast.error(isEdit ? 'Gagal memperbarui petugas' : 'Gagal menambahkan petugas')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Petugas' : 'Tambah Petugas'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loket">Loket</Label>
            <Input id="loket" value={loket} onChange={(e) => setLoket(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_kerja">Unit Kerja</Label>
            <Input
              id="unit_kerja"
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto">Foto {isEdit && '(opsional)'}</Label>
            <Input id="foto" type="file" accept="image/jpeg,image/png" onChange={handleFile} />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="size-24 rounded-md object-cover"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
