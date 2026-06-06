import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dialog, DialogContent, DialogTitle } from './dialog'

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
})
