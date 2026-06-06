import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getAdminSettings, updateSettings } from '@/lib/api'
import { useSettings } from '@/hooks/useSettings'
import type { SettingMeta } from '@/types'

export type DraftValue = string | number | boolean

/**
 * Hook pengelola pengaturan admin: memuat data, melacak draf perubahan,
 * validasi, dan menyimpan (dapat dibatasi per kategori). Memisahkan logika
 * dari UI sehingga sub-halaman per kategori cukup mengonsumsi state ini.
 */
export function useSettingsManager() {
  const { reload } = useSettings()
  const [items, setItems] = useState<SettingMeta[]>([])
  const [draft, setDraft] = useState<Record<string, DraftValue>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [savingCategory, setSavingCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const applyItems = useCallback((data: SettingMeta[]) => {
    setItems(data)
    const next: Record<string, DraftValue> = {}
    data.forEach((it) => {
      next[it.key] = it.value
    })
    setDraft(next)
  }, [])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      applyItems(await getAdminSettings())
    } catch {
      setError('Gagal memuat pengaturan. Periksa koneksi lalu coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [applyItems])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
  }, [fetchSettings])

  /** Item yang termasuk kategori tertentu. */
  const itemsByCategory = useCallback(
    (category: string) => items.filter((it) => it.category === category),
    [items],
  )

  /** Apakah kategori memiliki perubahan belum disimpan. */
  const isCategoryDirty = useCallback(
    (category: string) =>
      items.some((it) => it.category === category && draft[it.key] !== it.value),
    [items, draft],
  )

  /** Set kategori yang punya perubahan (untuk indikator di navigasi). */
  const dirtyCategories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((it) => {
      if (draft[it.key] !== it.value) set.add(it.category)
    })
    return set
  }, [items, draft])

  const setValue = useCallback((item: SettingMeta, raw: string) => {
    const value: DraftValue =
      item.type === 'int' || item.type === 'float'
        ? raw === ''
          ? ''
          : Number(raw)
        : raw
    setDraft((prev) => ({ ...prev, [item.key]: value }))
  }, [])

  /** Kembalikan draf satu kategori ke nilai tersimpan. */
  const resetCategory = useCallback(
    (category: string) => {
      setDraft((prev) => {
        const next = { ...prev }
        items
          .filter((it) => it.category === category)
          .forEach((it) => {
            next[it.key] = it.value
          })
        return next
      })
    },
    [items],
  )

  /** Simpan perubahan satu kategori saja. */
  const saveCategory = useCallback(
    async (category: string) => {
      const changed: Record<string, DraftValue> = {}
      const categoryItems = items.filter((it) => it.category === category)
      categoryItems.forEach((it) => {
        if (draft[it.key] !== it.value) changed[it.key] = draft[it.key]
      })
      if (Object.keys(changed).length === 0) return

      // Validasi: nilai numerik tidak boleh kosong/NaN.
      for (const it of categoryItems) {
        if (!(it.key in changed)) continue
        if (
          (it.type === 'int' || it.type === 'float') &&
          (changed[it.key] === '' || Number.isNaN(Number(changed[it.key])))
        ) {
          toast.error(`Nilai "${it.label}" harus berupa angka`)
          return
        }
      }

      setSavingCategory(category)
      try {
        const res = await updateSettings(changed)
        applyItems(res.settings)
        // Segarkan pengaturan publik agar perubahan branding/kiosk langsung tampil.
        await reload()
        toast.success(`${res.updated.length} pengaturan disimpan`)
      } catch {
        toast.error('Gagal menyimpan pengaturan')
      } finally {
        setSavingCategory(null)
      }
    },
    [items, draft, applyItems, reload],
  )

  return {
    loading,
    error,
    draft,
    savingCategory,
    dirtyCategories,
    fetchSettings,
    itemsByCategory,
    isCategoryDirty,
    setValue,
    resetCategory,
    saveCategory,
  }
}
