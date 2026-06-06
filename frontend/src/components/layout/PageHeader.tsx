import type { ReactNode } from 'react'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { BlurFade } from '@/components/ui/blur-fade'
import { GridPattern } from '@/components/ui/grid-pattern'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Judul utama halaman. */
  title: string
  /** Deskripsi singkat di bawah judul. Dapat berupa teks atau elemen. */
  description?: ReactNode
  /** Slot aksi di sisi kanan (tombol, dsb.). */
  actions?: ReactNode
  /** Warna awal gradasi judul. */
  colorFrom?: string
  /** Warna akhir gradasi judul. */
  colorTo?: string
  /** Atribut testid opsional untuk gradient judul. */
  titleTestId?: string
  /** Atribut testid opsional untuk kontainer hero. */
  testId?: string
  className?: string
}

/**
 * Header halaman admin yang seragam: hero gradient + grid pattern + judul
 * dengan AnimatedGradientText. Dipakai di semua halaman admin agar tampilan
 * antar halaman konsisten.
 */
export function PageHeader({
  title,
  description,
  actions,
  colorFrom = '#38bdf8',
  colorTo = '#34d399',
  titleTestId,
  testId,
  className,
}: PageHeaderProps) {
  return (
    <BlurFade delay={0.05}>
      <div
        data-testid={testId}
        className={cn(
          'relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-sky-500/10 via-background to-emerald-500/10 p-5 shadow-[0_20px_60px_-36px_rgba(14,165,233,0.55)]',
          className,
        )}
      >
        <GridPattern
          width={56}
          height={56}
          strokeDasharray="4 2"
          className="opacity-35 [mask-image:radial-gradient(circle_at_top,white,transparent_78%)]"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              <AnimatedGradientText
                data-testid={titleTestId}
                className="from-sky-400 to-emerald-400"
                colorFrom={colorFrom}
                colorTo={colorTo}
              >
                {title}
              </AnimatedGradientText>
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </BlurFade>
  )
}
