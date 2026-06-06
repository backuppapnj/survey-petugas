import type { AppSettings } from '@/types'

/**
 * Nilai default pengaturan aplikasi. Dipakai sebagai fallback bila backend
 * belum dapat dimuat (mis. saat startup, error jaringan, atau key baru yang
 * belum ada di DB). Harus selaras dengan SettingsSeeder di backend.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  // Branding
  app_title: 'Survei Kepuasan PTSP',
  app_subtitle: 'Masuk ke panel administrator untuk mengelola survei',
  sidebar_brand: 'Survei PTSP',
  sidebar_subtitle: 'Admin Panel',
  login_help_text: 'Lupa password? Hubungi pengelola sistem.',
  qr_print_title: 'Survei Kepuasan Pelayanan',
  qr_print_instruction: 'Pindai QR code di bawah ini',
  qr_print_cta: 'Pendapat Anda membantu kami melayani lebih baik.',
  // Kiosk
  kiosk_reset_timeout: 6000,
  saran_max_length: 1000,
  // Performance
  dashboard_poll_interval: 60000,
  petugas_page_size: 10,
  dashboard_default_range_days: 30,
  // IKM
  ikm_label_kecepatan: 'Kecepatan Pelayanan',
  ikm_label_keramahan: 'Keramahan & Perilaku',
  ikm_label_informasi: 'Kejelasan Informasi',
  ikm_label_kenyamanan: 'Kenyamanan',
  ikm_threshold_a: 88.31,
  ikm_threshold_b: 76.61,
  ikm_threshold_c: 65.0,
}

/**
 * Gabungkan respons parsial dari backend dengan default sehingga objek
 * AppSettings selalu lengkap meski backend hanya mengirim sebagian key
 * (mis. endpoint publik tidak menyertakan setting privat).
 */
export function mergeSettings(partial: Partial<AppSettings>): AppSettings {
  return { ...DEFAULT_SETTINGS, ...partial }
}
