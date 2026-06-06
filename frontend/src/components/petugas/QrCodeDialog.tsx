import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, Download, Printer, RefreshCw } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { regenerateToken } from '@/lib/api'
import { useSettings } from '@/hooks/useSettings'
import type { Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas: Petugas | null
  onTokenRegenerated?: (petugasId: number, newToken: string) => void
}

export function QrCodeDialog({ open, onOpenChange, petugas, onTokenRegenerated }: Props) {
  const { settings } = useSettings()
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [regenerating, setRegenerating] = useState<boolean>(false)

  if (!petugas) return null

  // Sertakan base path aplikasi (import.meta.env.BASE_URL). Di produksi SPA
  // dilayani dari "/app/" oleh CodeIgniter dan React Router memakai basename
  // "/app", sehingga URL survei HARUS berprefiks /app. Tanpa ini, QR mengarah
  // ke "/survey/:token" yang tidak punya route di backend → 404. BASE_URL selalu
  // diakhiri slash (Vite menjamin), jadi tidak ada risiko slash ganda.
  const surveyUrl = `${window.location.origin}${import.meta.env.BASE_URL}survey/${petugas.survey_token}`

  // Buat ulang token survei: panggil API, perbarui state parent, tampilkan notifikasi
  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const { survey_token } = await regenerateToken(petugas.id)
      onTokenRegenerated?.(petugas.id, survey_token)
      toast.success('Token diperbarui. Cetak ulang QR; QR lama tidak berlaku lagi.')
      setConfirmOpen(false)
    } catch {
      toast.error('Gagal membuat ulang token')
    } finally {
      setRegenerating(false)
    }
  }

  const handleDownload = () => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr-${petugas.nama.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
    toast.success('QR code diunduh')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl)
      setCopied(true)
      toast.success('URL disalin ke clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Gagal menyalin URL')
    }
  }

  const handlePrint = () => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')

    // Escape teks pengaturan & data petugas sebelum disisipkan ke HTML cetak
    // untuk mencegah HTML injection lewat nilai yang dapat diubah pengguna.
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    const printWin = window.open('', '_blank', 'width=600,height=800')
    if (!printWin) {
      toast.error('Browser memblokir pop-up. Izinkan pop-up untuk mencetak.')
      return
    }
    printWin.document.write(`
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>QR Survei — ${petugas.nama}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
              margin: 0;
              padding: 32px;
              text-align: center;
              color: #111;
            }
            .frame {
              border: 2px solid #111;
              border-radius: 12px;
              padding: 28px;
              max-width: 480px;
              margin: 0 auto;
            }
            h1 { margin: 0 0 4px; font-size: 22px; }
            .sub { color: #555; font-size: 13px; margin-bottom: 16px; }
            img { width: 320px; height: 320px; }
            .name { font-size: 18px; font-weight: 600; margin-top: 12px; }
            .loket { color: #555; font-size: 13px; }
            .url { font-size: 11px; color: #666; word-break: break-all; margin-top: 12px; }
            .cta { font-size: 13px; margin-top: 14px; }
            @media print {
              body { padding: 0; }
              .frame { border: 1px dashed #999; }
            }
          </style>
        </head>
        <body>
          <div class="frame">
            <h1>${esc(settings.qr_print_title)}</h1>
            <p class="sub">${esc(settings.qr_print_instruction)}</p>
            <img src="${dataUrl}" alt="QR Code" />
            <div class="name">${esc(petugas.nama)}</div>
            <div class="loket">${esc(petugas.loket)} · ${esc(petugas.unit_kerja)}</div>
            <p class="cta">${esc(settings.qr_print_cta)}</p>
            <p class="url">${surveyUrl}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code Survei — {petugas.nama}</DialogTitle>
          <DialogDescription>
            Tempelkan QR ini di loket {petugas.loket} agar pengunjung dapat memberi penilaian
            langsung.
          </DialogDescription>
        </DialogHeader>

        <div ref={containerRef} className="flex flex-col items-center gap-4">
          <div className="rounded-lg border bg-white p-4">
            <QRCodeCanvas value={surveyUrl} size={240} includeMargin level="M" />
          </div>

          <div className="flex w-full items-center gap-2">
            <Input value={surveyUrl} readOnly className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Salin URL"
              className="tap-target"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="mr-2 size-4" />
              Unduh PNG
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="mr-2 size-4" />
              Cetak
            </Button>
          </div>

          {/* Tombol pemicu dialog konfirmasi buat ulang token */}
          <div className="flex w-full">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(true)}>
              <RefreshCw className="mr-2 size-4" />
              Buat ulang token
            </Button>
          </div>

          {/* Dialog konfirmasi sebelum membuat ulang token QR */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Buat ulang token QR?</AlertDialogTitle>
                <AlertDialogDescription>
                  QR lama untuk <strong>{petugas.nama}</strong> tidak akan berlaku lagi dan harus
                  dicetak ulang. Lanjutkan?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate} disabled={regenerating}>
                  Buat ulang
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}
