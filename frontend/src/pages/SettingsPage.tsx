import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsCategoryForm } from '@/components/settings/SettingsCategoryForm'
import { SETTINGS_CATEGORIES } from '@/components/settings/categories'
import { useSettingsManager } from '@/hooks/useSettingsManager'

/**
 * Halaman Pengaturan: shell navigasi yang memecah pengaturan menjadi sub-form
 * per kategori (branding, kiosk, IKM, performa). Tiap kategori disimpan
 * terpisah agar lebih mudah dipahami dan dipelihara.
 */
export default function SettingsPage() {
  const manager = useSettingsManager()
  const { loading, error, fetchSettings, itemsByCategory, dirtyCategories } = manager
  const [active, setActive] = useState<string>(SETTINGS_CATEGORIES[0].id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Sesuaikan aplikasi tanpa mengubah kode. Pilih kategori, lalu simpan perubahan per bagian."
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-900/40 dark:bg-rose-950/20"
        >
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <Button onClick={fetchSettings}>Coba lagi</Button>
        </div>
      ) : (
        <Tabs value={active} onValueChange={setActive} className="space-y-4">
          <TabsList className="flex-wrap">
            {SETTINGS_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const dirty = dirtyCategories.has(cat.id)
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                  <Icon className="size-4" aria-hidden />
                  {cat.label}
                  {dirty && (
                    <span
                      className="size-1.5 rounded-full bg-amber-500"
                      aria-label="Ada perubahan belum disimpan"
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {SETTINGS_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <SettingsCategoryForm
                category={cat.id}
                items={itemsByCategory(cat.id)}
                manager={manager}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
