import { createContext } from 'react'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/lib/settings'

export interface SettingsContextValue {
  /** Pengaturan aktif (selalu lengkap; fallback ke default). */
  settings: AppSettings
  /** True selama pemuatan awal dari backend. */
  loading: boolean
  /** Muat ulang pengaturan dari backend (mis. setelah admin menyimpan). */
  reload: () => Promise<void>
}

/**
 * Context pengaturan aplikasi. Nilai awal memakai DEFAULT_SETTINGS agar
 * komponen tetap berfungsi sebelum provider memuat data dari backend.
 */
export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  reload: async () => {},
})
