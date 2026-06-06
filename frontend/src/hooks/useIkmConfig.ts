import { useMemo } from 'react'
import { useSettings } from '@/hooks/useSettings'
import type { IkmThresholds } from '@/lib/ikm'

export type UnsurKey = 'kecepatan' | 'keramahan' | 'informasi' | 'kenyamanan'

/**
 * Menyediakan konfigurasi IKM (label unsur & ambang batas mutu) dari
 * pengaturan administrator, dengan fallback default via SettingsProvider.
 */
export function useIkmConfig(): {
  labels: Record<UnsurKey, string>
  thresholds: IkmThresholds
} {
  const { settings } = useSettings()

  return useMemo(
    () => ({
      labels: {
        kecepatan: settings.ikm_label_kecepatan,
        keramahan: settings.ikm_label_keramahan,
        informasi: settings.ikm_label_informasi,
        kenyamanan: settings.ikm_label_kenyamanan,
      },
      thresholds: {
        a: settings.ikm_threshold_a,
        b: settings.ikm_threshold_b,
        c: settings.ikm_threshold_c,
      },
    }),
    [
      settings.ikm_label_kecepatan,
      settings.ikm_label_keramahan,
      settings.ikm_label_informasi,
      settings.ikm_label_kenyamanan,
      settings.ikm_threshold_a,
      settings.ikm_threshold_b,
      settings.ikm_threshold_c,
    ],
  )
}
