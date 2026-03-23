import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type MemberPortalSectionShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function MemberPortalSectionShell({
  eyebrow,
  title,
  description,
  children,
}: MemberPortalSectionShellProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <h1 className="font-display text-5xl uppercase tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:text-lg">
            {description}
          </p>
        </div>
      </header>

      <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_82%,white)] py-0 shadow-[0_24px_70px_rgba(16,18,24,0.06)]">
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-8">
          <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
            Espacio en preparación
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">
            Esta sección ya está integrada en la shell privada y preparada para recibir
            comportamiento real en los siguientes tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-8 sm:py-8">{children}</CardContent>
      </Card>
    </section>
  )
}
