export interface Petugas {
  id: number
  nama: string
  foto_url: string
  loket: string
  unit_kerja: string
  is_active?: number
}

export interface SurveiPayload {
  petugas_id: number
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
  foto_url: string
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
