import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPublicSettings } from '@/lib/api'
import { DEFAULT_SETTINGS, mergeSettings } from '@/lib/settings'
import type { AppSettings } from '@/types'
import { SettingsContext } from '@/contexts/SettingsContext'

/**
 * Provider yang memuat pengaturan publik dari backend saat startup dan
 * menyediakannya ke seluruh aplikasi. Jika pemuatan gagal, aplikasi tetap
 * berjalan dengan DEFAULT_SETTINGS (degradasi anggun).
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState<boolean>(true)

  const reload = useCallback(async () => {
    try {
      const partial = await getPublicSettings()
      setSettings(mergeSettings(partial))
    } catch {
      // Pertahankan default jika backend tidak tersedia.
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  const value = useMemo(() => ({ settings, loading, reload }), [settings, loading, reload])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
