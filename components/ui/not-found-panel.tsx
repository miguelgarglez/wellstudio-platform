import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type NotFoundAction = {
  href: string
  label: string
  variant?: 'default' | 'outline'
}

type NotFoundPanelProps = {
  eyebrow?: string
  title: string
  description: string
  note: string
  actions: NotFoundAction[]
  shellClassName?: string
  panelClassName?: string
}

export function NotFoundPanel({
  eyebrow = 'Error 404',
  title,
  description,
  note,
  actions,
  shellClassName,
  panelClassName,
}: NotFoundPanelProps) {
  return (
    <main className={cn('flex min-h-screen items-center px-5 py-12 sm:px-8 lg:px-10', shellClassName)}>
      <section
        className={cn(
          'relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_34px_90px_-52px_rgba(15,18,22,0.58)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,transparent)] backdrop-blur sm:rounded-[2.35rem] lg:grid-cols-[0.72fr_1.28fr]',
          panelClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--wellstudio-blue-soft)_82%,transparent),transparent)]" />
        <aside className="relative hidden min-h-full border-r border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)] px-8 py-9 lg:block">
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--wellstudio-blue-soft)_28%,transparent),transparent)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Ruta perdida</p>
              <p className="mt-4 font-display text-[8.5rem] leading-none tracking-[0.02em] text-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white)]">
                404
              </p>
            </div>
            <p className="max-w-56 text-sm leading-6 text-[color:color-mix(in_srgb,var(--wellstudio-ink)_62%,white)]">
              {note}
            </p>
          </div>
        </aside>

        <div className="px-6 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-13">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]/78">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance font-display text-[3rem] leading-[0.94] tracking-[0.01em] text-[var(--wellstudio-ink)] sm:text-[4.2rem] lg:text-[4.6rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-[color-mix(in_srgb,var(--wellstudio-ink)_68%,white)] sm:text-lg">
            {description}
          </p>
          <p className="mt-5 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-4 py-3 text-sm leading-6 text-[var(--wellstudio-blue-deep)] lg:hidden">
            {note}
          </p>
          <nav aria-label="Accesos recomendados" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  buttonVariants({ variant: action.variant ?? (index === 0 ? 'default' : 'outline'), size: 'lg' }),
                  'rounded-full px-6 transition-[background-color,border-color,color,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] sm:min-w-36',
                  index === 0 &&
                    'bg-[var(--wellstudio-blue)] text-[var(--wellstudio-ink)] shadow-[0_18px_38px_rgba(79,137,197,0.22)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_86%,white)]',
                  index > 0 &&
                    'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-white/60 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,var(--border))] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)]',
                )}
              >
                {action.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  )
}
