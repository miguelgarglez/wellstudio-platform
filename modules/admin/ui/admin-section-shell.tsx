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
    <section className="space-y-4 lg:min-h-full">
      <header className="rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_82%,white)] px-4 py-4 shadow-[0_14px_34px_rgba(18,20,24,0.05)] sm:px-5 lg:px-6">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.74fr)_minmax(20rem,0.9fr)] xl:items-end">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-pretty font-display text-3xl uppercase tracking-[0.035em] text-[var(--wellstudio-ink)] sm:text-4xl lg:text-[2.7rem]">
              {title}
            </h1>
          </div>
          <p className="max-w-4xl text-pretty text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:text-base">
            {description}
          </p>
        </div>
      </header>
      {children}
    </section>
  )
}
