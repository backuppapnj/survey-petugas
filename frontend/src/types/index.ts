export interface Petugas {
  id: number
  nama: string
  foto_url: string | null
  loket: string
  unit_kerja: string
  is_active?: number
  /** Token survei publik — hanya ada pada respons admin; respons publik tidak menyertakannya */
  survey_token?: string
}

export interface SurveiPayload {
  /** Token 16-karakter hex yang dipakai sebagai identifikasi survei (menggantikan petugas_id) */
  token: string
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
  saran?: string
}

export interface SurveiRecord {
  id: number
  petugas_id: number
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
  saran: string | null
  created_at: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AdminInfo {
  id: number
  username: string
  nama: string
}

export interface LoginResponse {
  token: string
  admin: AdminInfo
}

export interface RataRata {
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
}

export interface RekapSummary {
  total_responden: number
  rata_rata: RataRata
  ikm: number
}

export interface RekapPerPetugas {
  petugas_id: number
  nama: string
  foto_url: string | null
  total_responden: number
  rata_rata: RataRata
}

export interface RekapResponse {
  summary: RekapSummary
  per_petugas: RekapPerPetugas[]
  semua: SurveiRecord[]
}

export interface ApiError {
  status: number
  error: string
  messages?: Record<string, string>
}

export interface AnomaliLuarJamItem {
  petugas_id: number
  nama: string
  created_at: string
}

export interface AnomaliHarianItem {
  date: string
  survei: number
  dilayani: number
  anomali: boolean
}

export interface AnomaliOutlierItem {
  petugas_id: number
  nama: string
  jumlah: number
  rasio: number
}

export interface AnomaliResponse {
  range: { start: string; end: string }
  luar_jam: { total: number; items: AnomaliLuarJamItem[] }
  harian: { antrean_tersedia: boolean; items: AnomaliHarianItem[] }
  petugas_outlier: { median: number; items: AnomaliOutlierItem[] }
}

/**
 * Pengaturan aplikasi yang dapat dikonfigurasi administrator (disimpan di
 * tabel `settings` backend). Nilai publik dimuat tanpa autentikasi; nilai
 * privat (performance) hanya tersedia setelah admin login.
 */
export interface AppSettings {
  // Branding
  app_title: string
  app_subtitle: string
  sidebar_brand: string
  sidebar_subtitle: string
  login_help_text: string
  qr_print_title: string
  qr_print_instruction: string
  qr_print_cta: string
  // Kiosk
  kiosk_reset_timeout: number
  saran_max_length: number
  // Performance (privat)
  dashboard_poll_interval: number
  petugas_page_size: number
  dashboard_default_range_days: number
  // IKM
  ikm_label_kecepatan: string
  ikm_label_keramahan: string
  ikm_label_informasi: string
  ikm_label_kenyamanan: string
  ikm_threshold_a: number
  ikm_threshold_b: number
  ikm_threshold_c: number
}

/** Metadata pengaturan untuk UI admin (GET /api/admin/settings). */
export interface SettingMeta {
  key: keyof AppSettings
  value: string | number | boolean
  type: 'string' | 'int' | 'float' | 'bool' | 'json'
  category: string
  label: string
  is_public: boolean
}
