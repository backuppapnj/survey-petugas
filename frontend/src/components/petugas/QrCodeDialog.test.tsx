import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Petugas } from '@/types'

// Mock qrcode.react: jsdom tidak punya canvas 2D context. Sekaligus mengekspos
// nilai URL yang di-encode lewat data-value agar mudah diverifikasi di test.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div data-testid="qr-value" data-value={value} />
  ),
}))

import { QrCodeDialog } from './QrCodeDialog'

const petugas: Petugas = {
  id: 3,
  nama: 'Budi Santoso',
  foto_url: null,
  loket: 'Loket 1',
  unit_kerja: 'Pelayanan Umum',
  is_active: 1,
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
    expect(qr.getAttribute('data-value')).toMatch(/\/app\/survey\/3$/)
  })

  it('tidak menambahkan slash ganda pada URL saat dev (BASE_URL = /)', () => {
    vi.stubEnv('BASE_URL', '/')

    render(<QrCodeDialog open onOpenChange={() => {}} petugas={petugas} />)

    const qr = screen.getByTestId('qr-value')
    // Tepat satu slash sebelum "survey" — origin + /survey/3, tanpa slash ganda.
    expect(qr.getAttribute('data-value')).toMatch(/^https?:\/\/[^/]+\/survey\/3$/)
  })
})
