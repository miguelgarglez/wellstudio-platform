import type { ReactNode } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'

import { WellstudioLogoMark } from '@/components/brand/wellstudio-logo-mark'
import { LogoutButton } from '@/modules/auth/ui/logout-button'
import type { AdminShellSummary } from '@/modules/admin/server/admin-shell-summary'
import { cn } from '@/lib/utils'

type AdminShellProps = {
  children: ReactNode
  summary: AdminShellSummary
}

const adminNavItems = [
  {
    href: '/admin',
    label: 'Políticas',
    icon: ClipboardList,
  },
]

export function AdminShell({ children, summary }: AdminShellProps) {
  return (
    <div className="wellstudio-admin-shell min-h-screen bg-transparent text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        <div className="grid flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#121418_0%,#181b21_100%)] p-5 text-white shadow-[0_24px_70px_rgba(17,18,22,0.18)]">
                <div className="flex items-center gap-3 rounded-[1.45rem] border border-white/10 bg-white/4 px-3 py-3">
                  <WellstudioLogoMark className="size-12 rounded-[1rem] shadow-none" />
                  <div className="min-w-0">
                    <p className="font-display text-2xl uppercase tracking-[0.08em] text-white">
                      WellStudio
                    </p>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/62">
                      Control admin
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 px-1">
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">
                      Operador activo
                    </p>
                    <p className="text-lg font-medium text-white">{summary.displayName}</p>
                    <p className="text-sm text-white/70" translate="no">
                      {summary.email}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-white/12 px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-white/72">
                    {summary.rolesLabel}
                  </span>
                </div>

                <nav aria-label="Navegación admin" className="mt-7 flex flex-col gap-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current="page"
                        className={cn(
                          'flex items-center gap-3 rounded-[1.35rem] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white_6%)] px-4 py-3 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
                    Sesión
                  </p>
                  <p className="mt-3 text-sm text-white/70">
                    Esta superficie controla reglas operativas del dominio. Mantén cambios trazables y explícitos.
                  </p>
                  <div className="mt-4">
                    <LogoutButton
                      variant="ghost"
                      buttonClassName="justify-start border border-white/10 bg-white px-4 text-[var(--wellstudio-ink)] hover:bg-white/92 hover:text-[var(--wellstudio-ink)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3 rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_86%,white)] px-4 py-4 shadow-[0_18px_40px_rgba(18,20,24,0.06)] lg:hidden">
              <WellstudioLogoMark className="size-11 rounded-[0.95rem]" />
              <div className="min-w-0">
                <p className="font-display text-2xl uppercase tracking-[0.08em] text-[var(--wellstudio-ink)]">
                  WellStudio
                </p>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                  Control admin
                </p>
              </div>
            </div>

            <main id="main-content" className="pb-2">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
