import type { ReactNode } from 'react'
import Link from 'next/link'

import { WellstudioLogoMark } from '@/components/brand/wellstudio-logo-mark'

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="wellstudio-auth-shell min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/65 bg-white/75 shadow-[0_24px_80px_rgba(17,19,22,0.12)] backdrop-blur md:grid-cols-[1.15fr_0.85fr]">
        <section className="wellstudio-brand-panel order-2 relative flex min-h-[18rem] flex-col justify-between overflow-hidden px-6 py-6 text-white sm:px-8 sm:py-8 md:order-1 lg:px-10 lg:py-10">
          <div className="wellstudio-grid-line absolute inset-x-0 top-[7.25rem] h-px opacity-70" />
          <div className="relative z-10 flex items-start justify-between gap-6">
            <Link
              href="/"
              className="flex items-center gap-4"
            >
              <WellstudioLogoMark className="size-20 rounded-[1.7rem] shadow-lg sm:size-24" />
              <div className="hidden sm:block">
                <p className="font-display text-4xl uppercase tracking-[0.08em] text-white">
                  WellStudio
                </p>
                <p className="max-w-xs text-sm text-white/70">
                  Centro boutique centrado en fuerza, seguimiento personal y grupos reducidos.
                </p>
              </div>
            </Link>
            <nav
              aria-label="Public navigation"
              className="hidden items-center gap-5 text-sm text-white/72 lg:flex"
            >
              <Link
                href="/"
                className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Inicio
              </Link>
              <Link
                href="/login"
                className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Acceso
              </Link>
              <Link
                href="/register"
                className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Registro
              </Link>
            </nav>
          </div>

          <div className="relative z-10 mt-8 flex max-w-xl flex-col gap-6 md:mt-12">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
                {eyebrow}
              </p>
              <h1 className="font-display text-balance text-5xl leading-none uppercase tracking-[0.04em] text-white sm:text-6xl">
                {title}
              </h1>
            </div>
            <p className="max-w-lg text-base leading-8 text-white/78 sm:text-lg">
              {description}
            </p>

            <div className="grid gap-3 pt-2 text-sm text-white/72 sm:grid-cols-3 md:pt-4">
              <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-4 backdrop-blur">
                <p className="font-display text-2xl uppercase text-white">1:1</p>
                <p>Entrenamiento personal de seguimiento cercano.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-4 backdrop-blur">
                <p className="font-display text-2xl uppercase text-white">4 max</p>
                <p>Grupos premium pensados para corrección técnica real.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-4 backdrop-blur">
                <p className="font-display text-2xl uppercase text-white">Madrid</p>
                <p>Centro boutique con trato directo y foco en resultados.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 flex items-start justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(247,245,241,0.96))] px-5 py-6 sm:px-8 sm:py-8 md:order-2 md:items-center lg:px-10">
          <div className="flex w-full max-w-md flex-col gap-5 sm:gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-3 self-start rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,var(--border))] bg-white/90 px-3 py-2 text-[var(--wellstudio-ink)] shadow-sm md:hidden"
            >
              <WellstudioLogoMark className="size-10 rounded-2xl shadow-none" />
              <span className="font-display text-xl uppercase tracking-[0.08em]">
                WellStudio
              </span>
            </Link>
            {children}
            {footer ? (
              <div className="text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
