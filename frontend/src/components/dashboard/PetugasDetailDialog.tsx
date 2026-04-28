import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { categorizeIkm, hitungIkm } from '@/lib/ikm'
import { cn } from '@/lib/utils'
import type { Petugas, RekapPerPetugas, SurveiRecord } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugasId: number | null
  perPetugas: RekapPerPetugas[]
  semua: SurveiRecord[]
  petugas: Petugas[]
}

const formatTanggal = (iso: string): string => {
  try {
    const d = new Date(iso.replace(' ', 'T'))
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const ASPEK = [
  { key: 'kecepatan', label: 'Kecepatan', color: 'var(--chart-1)' },
  { key: 'keramahan', label: 'Keramahan', color: 'var(--chart-2)' },
  { key: 'informasi', label: 'Informasi', color: 'var(--chart-3)' },
  { key: 'kenyamanan', label: 'Kenyamanan', color: 'var(--chart-4)' },
] as const

export function PetugasDetailDialog({
  open,
  onOpenChange,
  petugasId,
  perPetugas,
  semua,
  petugas,
}: Props) {
  const target = useMemo(
    () => perPetugas.find((p) => p.petugas_id === petugasId),
    [perPetugas, petugasId],
  )

  const profil = useMemo(
    () => petugas.find((p) => p.id === petugasId),
    [petugas, petugasId],
  )

  const records = useMemo(
    () =>
      semua
        .filter((r) => r.petugas_id === petugasId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [semua, petugasId],
  )

  if (!target) return null

  const ikm = hitungIkm(target.rata_rata)
  const kategori = categorizeIkm(ikm)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={profil?.foto_url ?? target.foto_url} alt={target.nama} />
              <AvatarFallback>{target.nama.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span>{target.nama}</span>
              {profil && (
                <span className="text-xs font-normal text-muted-foreground">
                  {profil.loket} · {profil.unit_kerja}
                </span>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Ringkasan kinerja {target.total_responden} responden pada periode terpilih.
          </DialogDescription>
        </DialogHeader>

        {/* Summary chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            {target.total_responden} responden
          </Badge>
          <Badge variant="outline" className="font-semibold">
            IKM {ikm.toFixed(2)}
          </Badge>
          <Badge className={cn(kategori.bg, kategori.color)}>
            {kategori.grade} · {kategori.mutu}
          </Badge>
        </div>

        {/* Aspek bars */}
        <div className="grid grid-cols-2 gap-3">
          {ASPEK.map(({ key, label, color }) => {
            const v = target.rata_rata[key]
            return (
              <div key={key} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="tabular-nums">{v.toFixed(2)} / 5</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(v / 5) * 100}%`, background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Daftar responden */}
        <div>
          <h3 className="mb-2 text-sm font-medium">Riwayat Responden</h3>
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada responden.
            </p>
          ) : (
            <ScrollArea className="h-64 rounded-md border">
              <ul className="divide-y">
                {records.map((r) => {
                  const avg = (r.kecepatan + r.keramahan + r.informasi + r.kenyamanan) / 4
                  const low = avg < 4
                  return (
                    <li key={r.id} className="p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={low ? 'destructive' : 'secondary'} className="gap-1">
                          <Star className="size-3 fill-current" aria-hidden />
                          {avg.toFixed(2)}
                        </Badge>
                        <span className="text-muted-foreground">{formatTanggal(r.created_at)}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground sm:grid-cols-4">
                        <span>Kecepatan: <strong className="text-foreground">{r.kecepatan}</strong></span>
                        <span>Keramahan: <strong className="text-foreground">{r.keramahan}</strong></span>
                        <span>Informasi: <strong className="text-foreground">{r.informasi}</strong></span>
                        <span>Kenyamanan: <strong className="text-foreground">{r.kenyamanan}</strong></span>
                      </div>
                      {r.saran && (
                        <p className="mt-2 rounded bg-muted/50 p-2 text-sm italic">
                          “{r.saran}”
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
