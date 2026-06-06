import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SettingMeta } from '@/types'
import type { DraftValue } from '@/hooks/useSettingsManager'

interface SettingFieldProps {
  item: SettingMeta
  value: DraftValue
  onChange: (item: SettingMeta, raw: string) => void
}

/** Render satu field pengaturan (teks atau angka) beserta labelnya. */
export function SettingField({ item, value, onChange }: SettingFieldProps) {
  const isNumber = item.type === 'int' || item.type === 'float'

  return (
    <div className="space-y-1.5">
      <Label htmlFor={item.key} className="text-sm font-medium">
        {item.label}
      </Label>
      <Input
        id={item.key}
        type={isNumber ? 'number' : 'text'}
        step={item.type === 'float' ? '0.01' : undefined}
        value={String(value ?? '')}
        onChange={(e) => onChange(item, e.target.value)}
        className="border-blue-200/70 focus-visible:border-blue-400 focus-visible:ring-blue-500/25 dark:border-blue-900/60"
      />
    </div>
  )
}
