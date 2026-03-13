import type { ReactNode } from 'react'
import Link from 'next/link'

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
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
        <section className="wellstudio-brand-panel relative flex min-h-[18rem] flex-col justify-between overflow-hidden px-6 py-6 text-white sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="wellstudio-grid-line absolute inset-x-0 top-[7.25rem] h-px opacity-70" />
          <div className="relative z-10 flex items-start justify-between gap-6">
            <Link
              href="/"
              className="flex items-center gap-4"
            >
              <div className="wellstudio-logo-badge flex size-20 items-center justify-center rounded-[1.7rem] text-[3rem] font-semibold text-[var(--wellstudio-ink)] shadow-lg sm:size-24 sm:text-[3.5rem]">
                W
              </div>
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

          <div className="relative z-10 mt-12 flex max-w-xl flex-col gap-6">
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

            <div className="grid gap-3 pt-4 text-sm text-white/72 sm:grid-cols-3">
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

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(247,245,241,0.96))] px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex w-full max-w-md flex-col gap-6">
            {children}
            <div className="text-sm text-muted-foreground">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
