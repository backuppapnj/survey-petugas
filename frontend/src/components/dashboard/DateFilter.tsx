import { Download, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DateFilterProps {
  start: string
  end: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onExport: () => void
  exporting?: boolean
  // P3-22: filter unit kerja
  unitKerja?: string
  onUnitKerjaChange?: (v: string) => void
  unitOptions?: string[]
}

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const PRESETS: Array<{ key: string; label: string; range: () => [string, string] }> = [
  {
    key: 'today',
    label: 'Hari ini',
    range: () => {
      const t = fmt(new Date())
      return [t, t]
    },
  },
  {
    key: '7d',
    label: '7 hari terakhir',
    range: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 6)
      return [fmt(start), fmt(end)]
    },
  },
  {
    key: '30d',
    label: '30 hari terakhir',
    range: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 29)
      return [fmt(start), fmt(end)]
    },
  },
  {
    key: 'mtd',
    label: 'Bulan ini',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return [fmt(start), fmt(now)]
    },
  },
  {
    key: 'lm',
    label: 'Bulan lalu',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [fmt(start), fmt(end)]
    },
  },
  {
    key: 'ytd',
    label: 'Tahun ini',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      return [fmt(start), fmt(now)]
    },
  },
]

export function DateFilter({
  start,
  end,
  onStartChange,
  onEndChange,
  onExport,
  exporting,
  unitKerja,
  onUnitKerjaChange,
  unitOptions,
}: DateFilterProps) {
  // Cocokkan rentang aktif ke preset
  const activePreset = PRESETS.find((p) => {
    const [s, e] = p.range()
    return s === start && e === end
  })?.key

  const invalid = start > end

  const applyPreset = (key: string) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    const [s, e] = preset.range()
    onStartChange(s)
    onEndChange(e)
  }

  const reset = () => applyPreset('30d')

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            type="button"
            size="sm"
            variant={activePreset === p.key ? 'default' : 'outline'}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Custom range + filter unit + ekspor */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <Label htmlFor="start">Mulai</Label>
          <Input
            id="start"
            type="date"
            value={start}
            max={end}
            onChange={(e) => onStartChange(e.target.value)}
            className={cn(invalid && 'border-destructive')}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">Selesai</Label>
          <Input
            id="end"
            type="date"
            value={end}
            min={start}
            onChange={(e) => onEndChange(e.target.value)}
            className={cn(invalid && 'border-destructive')}
          />
        </div>

        {onUnitKerjaChange && unitOptions && unitOptions.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="unit">Unit Kerja</Label>
            <Select value={unitKerja ?? '__all__'} onValueChange={onUnitKerjaChange}>
              <SelectTrigger id="unit" className="w-full md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Unit Kerja</SelectItem>
                {unitOptions.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 md:ml-auto">
          <Button onClick={reset} variant="ghost" size="sm" type="button" title="Reset ke 30 hari terakhir">
            <RotateCcw className="size-4" />
            <span className="sr-only">Reset</span>
          </Button>
          <Button onClick={onExport} variant="outline" disabled={exporting || invalid}>
            <Download className="mr-2 size-4" />
            {exporting ? 'Mengunduh...' : 'Ekspor Excel'}
          </Button>
        </div>
      </div>

      {invalid && (
        <p className="text-xs text-destructive">
          Tanggal mulai harus lebih awal atau sama dengan tanggal selesai.
        </p>
      )}
    </div>
  )
}
