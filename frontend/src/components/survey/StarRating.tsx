import { useRef, useState } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  label: string
}

const DESKRIPSI = [
  '',
  'Sangat Tidak Puas',
  'Tidak Puas',
  'Cukup',
  'Puas',
  'Sangat Puas',
] as const

export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState<number>(0)
  const groupRef = useRef<HTMLDivElement | null>(null)
  const display = hover || value
  const desc = DESKRIPSI[display] ?? ''

  const fokuskanRating = (next: number) => {
    onChange(next)
    setHover(next)

    const nextButton = groupRef.current?.querySelector<HTMLButtonElement>(
      `[aria-label="${DESKRIPSI[next]} (${next} bintang)"]`,
    )
    nextButton?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span
          className={cn(
            'text-xs',
            display === 0 && 'text-muted-foreground',
            display > 0 && display <= 2 && 'font-medium text-rose-600 dark:text-rose-400',
            display === 3 && 'text-amber-600 dark:text-amber-400',
            display >= 4 && 'font-medium text-emerald-600 dark:text-emerald-400',
          )}
          aria-live="polite"
        >
          {desc || 'Pilih rating'}
        </span>
      </div>
      <div
        ref={groupRef}
        className="flex gap-1"
        role="radiogroup"
        aria-label={`Rating ${label}`}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= display
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              tabIndex={value === 0 ? (n === 1 ? 0 : -1) : value === n ? 0 : -1}
              data-active={active}
              whileTap={{
                scale: 0.88,
                transition: { type: 'spring', stiffness: 320, damping: 14 },
              }}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => onChange(n)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  fokuskanRating(Math.min(5, n + 1))
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  fokuskanRating(Math.max(1, n - 1))
                }
              }}
              aria-label={`${DESKRIPSI[n]} (${n} bintang)`}
              className={cn(
                'rounded-full p-1 transition-transform hover:scale-110 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <Star
                className={cn(
                  'size-9 transition-colors',
                  active ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
                )}
                aria-hidden
              />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
