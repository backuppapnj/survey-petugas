import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Petugas } from '@/types'

// Mock qrcode.react: jsdom tidak punya canvas 2D context. Sekaligus mengekspos
// nilai URL yang di-encode lewat data-value agar mudah diverifikasi di test.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div data-testid="qr-value" data-value={value} />
  ),
}))

// Mock modul API agar tidak ada pemanggilan HTTP sungguhan dalam unit test
vi.mock('@/lib/api', () => ({
  regenerateToken: vi.fn().mockResolvedValue({ survey_token: 'tokBARU' }),
}))

// Mock toast sonner agar tidak ada efek samping notifikasi saat pengujian
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { QrCodeDialog } from './QrCodeDialog'

const petugas: Petugas = {
  id: 3,
  nama: 'Budi Santoso',
  foto_url: null,
  loket: 'Loket 1',
  unit_kerja: 'Pelayanan Umum',
  is_active: 1,
  survey_token: 'tok123abc',
}

describe('QrCodeDialog', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('menyertakan base path /app pada URL survei saat dilayani di bawah /app (produksi)', () => {
    // Simulasikan build produksi: SPA dilayani dari "/app/" (lihat vite.config.ts
    // base & main.tsx basename). URL QR HARUS menyertakan prefix /app, jika tidak
    // backend CodeIgniter mengembalikan 404 saat QR dipindai.
    vi.stubEnv('BASE_URL', '/app/')

    render(<QrCodeDialog open onOpenChange={() => {}} petugas={petugas} />)

    const qr = screen.getByTestId('qr-value')
    expect(qr.getAttribute('data-value')).toMatch(/\/app\/survey\/tok123abc$/)
  })

  it('tidak menambahkan slash ganda pada URL saat dev (BASE_URL = /)', () => {
    vi.stubEnv('BASE_URL', '/')

    render(<QrCodeDialog open onOpenChange={() => {}} petugas={petugas} />)

    const qr = screen.getByTestId('qr-value')
    // Tepat satu slash sebelum "survey" — origin + /survey/tok123abc, tanpa slash ganda.
    expect(qr.getAttribute('data-value')).toMatch(/^https?:\/\/[^/]+\/survey\/tok123abc$/)
  })

  it('tombol buat ulang token: konfirmasi lalu memanggil regenerateToken & callback', async () => {
    const { regenerateToken } = await import('@/lib/api')
    const onTokenRegenerated = vi.fn()
    render(<QrCodeDialog open onOpenChange={() => {}} petugas={petugas} onTokenRegenerated={onTokenRegenerated} />)
    fireEvent.click(screen.getByRole('button', { name: /buat ulang token/i }))
    fireEvent.click(screen.getByRole('button', { name: /^buat ulang$/i }))
    await waitFor(() => expect(regenerateToken).toHaveBeenCalledWith(3))
    await waitFor(() => expect(onTokenRegenerated).toHaveBeenCalledWith(3, 'tokBARU'))
  })
})
