import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from './dialog'

describe('DialogContent responsif (mobile-first)', () => {
  it('membatasi tinggi 90dvh & dapat di-scroll di layar pendek', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Judul</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const content = document.querySelector('[data-slot="dialog-content"]')
    expect(content).not.toBeNull()
    expect(content!.className).toContain('overflow-y-auto')
    expect(content!.className).toContain('max-h-[90dvh]')
  })

  it('DialogFooter sticky di bawah agar tombol tetap terlihat saat konten di-scroll', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Judul</DialogTitle>
          <DialogFooter>
            <button>Simpan</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
    const footer = document.querySelector('[data-slot="dialog-footer"]')
    expect(footer).not.toBeNull()
    expect(footer!.className).toContain('sticky')
    expect(footer!.className).toContain('-bottom-4')
  })
})
