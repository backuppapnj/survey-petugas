import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas: Petugas | null
}

export function QrCodeDialog({ open, onOpenChange, petugas }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (!petugas) return null

  // URL survey publik untuk petugas terpilih
  const surveyUrl = `${window.location.origin}/survey/${petugas.id}`

  const handleDownload = () => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr-${petugas.nama.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code — {petugas.nama}</DialogTitle>
        </DialogHeader>
        <div ref={containerRef} className="flex flex-col items-center gap-4">
          <QRCodeCanvas value={surveyUrl} size={256} includeMargin />
          <p className="text-center text-sm text-muted-foreground">{surveyUrl}</p>
          <Button onClick={handleDownload}>
            <Download className="mr-2 size-4" />
            Unduh PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
