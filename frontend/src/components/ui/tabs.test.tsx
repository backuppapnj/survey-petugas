import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsList, TabsTrigger } from './tabs'

describe('TabsList responsif (mobile-first)', () => {
  it('dapat di-scroll horizontal saat tab melebihi lebar (overflow-x-auto + max-w-full)', () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Ringkasan</TabsTrigger>
          <TabsTrigger value="b">Distribusi Rating</TabsTrigger>
          <TabsTrigger value="c">Tabel Detail</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const list = container.querySelector('[data-slot="tabs-list"]')
    expect(list).not.toBeNull()
    expect(list!.className).toContain('overflow-x-auto')
    expect(list!.className).toContain('max-w-full')
  })
})
