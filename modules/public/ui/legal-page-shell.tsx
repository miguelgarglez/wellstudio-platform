import type { ReactNode } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

type LegalPageShellProps = {
  eyebrow: string
  title: string
  description: string
  currentPath: '/privacy-policy' | '/terms'
  lastUpdated: string
  contactEmail: string
  children: ReactNode
}

const navLinks = [
  { href: '/privacy-policy', label: 'Privacidad' },
  { href: '/terms', label: 'Condiciones' },
  { href: '/register', label: 'Registro' },
] as const

export function LegalPageShell({
  eyebrow,
  title,
  description,
  currentPath,
  lastUpdated,
  contactEmail,
  children,
}: LegalPageShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[linear-gradient(180deg,rgba(183,206,231,0.16),rgba(247,245,241,0.92))] px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col rounded-[2rem] border border-white/65 bg-white/78 shadow-[0_24px_80px_rgba(17,19,22,0.12)] backdrop-blur">
        <header className="flex flex-col gap-8 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
            >
              <div className="wellstudio-logo-badge flex size-12 items-center justify-center rounded-[1.2rem] text-3xl font-semibold text-[var(--wellstudio-ink)] shadow-none">
                W
              </div>
              <div>
                <p className="font-display text-2xl uppercase tracking-[0.08em] text-[var(--wellstudio-ink)]">
                  WellStudio
                </p>
                <p className="text-sm text-muted-foreground">Documentación pública y condiciones de acceso</p>
              </div>
            </Link>
            <nav
              aria-label="Legal navigation"
              className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            >
              {navLinks.map((link) => {
                const isActive = link.href === currentPath

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'rounded-full px-3 py-2 underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]',
                      isActive
                        ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]'
                        : 'hover:text-[var(--wellstudio-blue-deep)] hover:underline',
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
              {eyebrow}
            </p>
            <h1 className="font-display text-balance text-5xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)] sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-3 py-1.5">
                Información pública vigente
              </span>
              <span>Última actualización: {lastUpdated}</span>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-8 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <article className="max-w-none text-[var(--wellstudio-ink)] [&_a]:font-medium [&_a]:text-[var(--wellstudio-blue-deep)] [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:uppercase [&_h2]:tracking-[0.04em] [&_li]:leading-8 [&_p]:leading-8 [&_section]:space-y-4 [&_section]:rounded-[1.75rem] [&_section]:border [&_section]:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] [&_section]:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_3%,white)] [&_section]:px-5 [&_section]:py-5 sm:[&_section]:px-7 sm:[&_section]:py-6 [&_section+section]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}

            <div className="mt-8 border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] pt-5">
              <PublicSiteFooter />
            </div>
          </article>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-5 py-5 shadow-[0_14px_40px_rgba(47,75,103,0.08)]">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
                Lo esencial
              </p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                <div>
                  <p className="font-medium text-[var(--wellstudio-ink)]">Responsable visible</p>
                  <p>WellStudio</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--wellstudio-ink)]">Contacto</p>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </div>
                <div>
                  <p className="font-medium text-[var(--wellstudio-ink)]">Estado</p>
                  <p>Documento base vigente en esta fase inicial, sujeto a ampliación o revisión posterior.</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--wellstudio-ink)]">Actualizado</p>
                  <p>{lastUpdated}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
