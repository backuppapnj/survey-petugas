import { Image, MessageSquare, Gauge, Monitor, type LucideIcon } from 'lucide-react'

/** Metadata tampilan setiap kategori pengaturan. */
export interface CategoryMeta {
  /** Slug kategori (sesuai kolom `category` di backend). */
  id: string
  /** Label ramah-pengguna. */
  label: string
  /** Deskripsi singkat untuk header sub-halaman. */
  description: string
  /** Ikon navigasi. */
  icon: LucideIcon
  /** Urutan tampil. */
  order: number
}

/**
 * Daftar kategori pengaturan beserta metadata UI. Sumber tunggal kebenaran
 * (single source of truth) yang dipakai navigasi tab maupun form per kategori.
 */
export const SETTINGS_CATEGORIES: CategoryMeta[] = [
  {
    id: 'branding',
    label: 'Branding & Teks',
    description: 'Judul aplikasi, nama panel, dan teks yang tampil ke pengguna.',
    icon: Image,
    order: 1,
  },
  {
    id: 'kiosk',
    label: 'Kiosk Survei',
    description: 'Perilaku halaman survei publik (mode kiosk).',
    icon: MessageSquare,
    order: 2,
  },
  {
    id: 'ikm',
    label: 'Indeks Kepuasan (IKM)',
    description:
      'Label unsur penilaian dan ambang batas mutu (default PermenPAN-RB 14/2017).',
    icon: Gauge,
    order: 3,
  },
  {
    id: 'performance',
    label: 'Performa & Tampilan Data',
    description: 'Pengaturan polling dashboard, paginasi, dan rentang tanggal default.',
    icon: Monitor,
    order: 4,
  },
]

/** Cari metadata kategori berdasarkan id; fallback ke metadata generik. */
export function getCategoryMeta(id: string): CategoryMeta {
  return (
    SETTINGS_CATEGORIES.find((c) => c.id === id) ?? {
      id,
      label: id,
      description: '',
      icon: Monitor,
      order: 99,
    }
  )
}
