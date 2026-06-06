import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DateFilter } from './DateFilter'

const noop = () => {}

describe('DateFilter responsif (mobile-first)', () => {
  it('menata tanggal Mulai & Selesai dalam 2 kolom di layar kecil', () => {
    const { container } = render(
      <DateFilter start="2026-06-01" end="2026-06-06" onStartChange={noop} onEndChange={noop} onExport={noop} />,
    )
    const grid = container.querySelector('.grid-cols-2')
    expect(grid).not.toBeNull()
    expect(grid!.querySelector('#start')).not.toBeNull()
    expect(grid!.querySelector('#end')).not.toBeNull()
  })

  it('tombol reset punya area sentuh nyaman (tap-target)', () => {
    render(
      <DateFilter start="2026-06-01" end="2026-06-06" onStartChange={noop} onEndChange={noop} onExport={noop} />,
    )
    expect(screen.getByRole('button', { name: /reset/i })).toHaveClass('tap-target')
  })
})
