import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas: Petugas | null
}

export function QrCodeDialog({ open, onOpenChange, petugas }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<boolean>(false)

  if (!petugas) return null

  const surveyUrl = `${window.location.origin}/survey/${petugas.id}`

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
            <h1>Survei Kepuasan Pelayanan</h1>
            <p class="sub">Pindai QR code di bawah ini</p>
            <img src="${dataUrl}" alt="QR Code" />
            <div class="name">${petugas.nama}</div>
            <div class="loket">${petugas.loket} · ${petugas.unit_kerja}</div>
            <p class="cta">Pendapat Anda membantu kami melayani lebih baik.</p>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
