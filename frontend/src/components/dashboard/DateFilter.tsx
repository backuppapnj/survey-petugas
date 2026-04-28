import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateFilterProps {
  start: string
  end: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onExport: () => void
}

export function DateFilter({
  start,
  end,
  onStartChange,
  onEndChange,
  onExport,
}: DateFilterProps) {
  return (
    <div className="flex flex-col items-start gap-3 md:flex-row md:items-end">
      <div className="space-y-1">
        <Label htmlFor="start">Mulai</Label>
        <Input
          id="start"
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="end">Selesai</Label>
        <Input id="end" type="date" value={end} onChange={(e) => onEndChange(e.target.value)} />
      </div>
      <Button onClick={onExport} variant="outline">
        <Download className="mr-2 size-4" />
        Ekspor Excel
      </Button>
    </div>
  )
}
