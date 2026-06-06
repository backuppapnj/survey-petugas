import { Loader2, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingField } from '@/components/settings/SettingField'
import { getCategoryMeta } from '@/components/settings/categories'
import type { SettingMeta } from '@/types'
import type { useSettingsManager } from '@/hooks/useSettingsManager'

interface SettingsCategoryFormProps {
  category: string
  items: SettingMeta[]
  manager: ReturnType<typeof useSettingsManager>
}

/**
 * Form pengaturan untuk SATU kategori. Memiliki tombol simpan & batalkan
 * sendiri sehingga administrator dapat menyimpan tiap bagian secara terpisah.
 */
export function SettingsCategoryForm({ category, items, manager }: SettingsCategoryFormProps) {
  const meta = getCategoryMeta(category)
  const { draft, setValue, resetCategory, saveCategory, isCategoryDirty, savingCategory } = manager

  const dirty = isCategoryDirty(category)
  const saving = savingCategory === category

  return (
    <Card className="border border-blue-500/20 shadow-[0_18px_55px_-38px_rgba(37,99,235,0.45)]">
      <CardHeader>
        <CardTitle>{meta.label}</CardTitle>
        {meta.description && (
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <SettingField
            key={item.key}
            item={item}
            value={draft[item.key]}
            onChange={setValue}
          />
        ))}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => resetCategory(category)}
          disabled={!dirty || saving}
        >
          <RotateCcw className="mr-2 size-4" />
          Batalkan
        </Button>
        <Button
          size="sm"
          className="app-gradient-button border border-blue-300/40 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:from-sky-400 hover:to-blue-500"
          onClick={() => saveCategory(category)}
          disabled={!dirty || saving}
        >
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="mr-2 size-4" aria-hidden />
          )}
          Simpan
        </Button>
      </CardFooter>
    </Card>
  )
}
