import { useRef } from 'react'
import { NILAI_PERSEPSI } from '@/lib/ikm'
import { cn } from '@/lib/utils'

interface RatingScaleProps {
  value: number
  onChange: (value: number) => void
  label: string
}

// Penilaian 4-poin berlabel persepsi resmi PermenPAN-RB 14/2017.
// Aksesibel sebagai radiogroup dengan navigasi panah keyboard.
export function RatingScale({ value, onChange, label }: RatingScaleProps) {
  const groupRef = useRef<HTMLDivElement | null>(null)

  const fokuskanNilai = (next: number) => {
    onChange(next)
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-nilai="${next}"]`)
      ?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        ref={groupRef}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="radiogroup"
        aria-label={`Penilaian ${label}`}
      >
        {NILAI_PERSEPSI.map(({ nilai, label: persepsi }) => {
          const active = value === nilai
          return (
            <button
              key={nilai}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${persepsi} (nilai ${nilai})`}
              data-nilai={nilai}
              data-active={active}
              tabIndex={value === 0 ? (nilai === 1 ? 0 : -1) : active ? 0 : -1}
              onClick={() => onChange(nilai)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  fokuskanNilai(Math.min(4, nilai + 1))
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  fokuskanNilai(Math.max(1, nilai - 1))
                }
              }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                  ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                  : 'border-border hover:border-blue-400 hover:bg-muted',
              )}
            >
              <span className="text-lg font-bold tabular-nums">{nilai}</span>
              <span className="text-xs font-medium leading-tight">{persepsi}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
