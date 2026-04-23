import type { ReactNode } from 'react'

type AdminSectionShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function AdminSectionShell({
  eyebrow,
  title,
  description,
  children,
}: AdminSectionShellProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <h1 className="text-pretty font-display text-4xl uppercase tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl lg:text-[3.45rem]">
            {title}
          </h1>
          <p className="max-w-3xl text-pretty text-base leading-8 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:text-lg">
            {description}
          </p>
        </div>
      </header>
      {children}
    </section>
  )
}
