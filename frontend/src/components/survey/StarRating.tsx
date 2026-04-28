import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  label: string
}

export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState<number>(0)
  const display = hover || value

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= display
          return (
            <button
              key={n}
              type="button"
              data-active={active}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(n)}
              aria-label={`Rating ${n}`}
              className={cn(
                'rounded-full p-1 transition-transform hover:scale-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <Star
                className={cn(
                  'size-8 transition-colors',
                  active ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
