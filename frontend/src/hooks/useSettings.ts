import { useContext } from 'react'
import { SettingsContext } from '@/contexts/SettingsContext'

/** Hook untuk mengakses pengaturan aplikasi dari SettingsProvider. */
export function useSettings() {
  return useContext(SettingsContext)
}
