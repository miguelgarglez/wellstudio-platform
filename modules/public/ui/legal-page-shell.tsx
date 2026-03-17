import type { ReactNode } from 'react'
import Link from 'next/link'

import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

type LegalPageShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function LegalPageShell({
  eyebrow,
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[linear-gradient(180deg,rgba(183,206,231,0.16),rgba(247,245,241,0.92))] px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col rounded-[2rem] border border-white/65 bg-white/78 shadow-[0_24px_80px_rgba(17,19,22,0.12)] backdrop-blur">
        <header className="flex flex-col gap-6 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] px-6 py-6 sm:px-8 sm:py-8">
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
                <p className="text-sm text-muted-foreground">Información pública mínima para V1</p>
              </div>
            </Link>
            <nav
              aria-label="Legal navigation"
              className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
            >
              <Link
                href="/privacy-policy"
                className="rounded-full px-3 py-2 underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Privacidad
              </Link>
              <Link
                href="/terms"
                className="rounded-full px-3 py-2 underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Condiciones
              </Link>
              <Link
                href="/register"
                className="rounded-full px-3 py-2 underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Registro
              </Link>
            </nav>
          </div>

          <div className="flex max-w-3xl flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
              {eyebrow}
            </p>
            <h1 className="font-display text-balance text-5xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)] sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col px-6 py-6 sm:px-8 sm:py-8">
          <article className="prose prose-zinc max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-[0.04em] prose-p:text-[var(--wellstudio-ink)] prose-p:leading-8 prose-strong:text-[var(--wellstudio-blue-deep)]">
            {children}
          </article>

          <div className="mt-10 border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] pt-5">
            <PublicSiteFooter />
          </div>
        </div>
      </div>
    </main>
  )
}
