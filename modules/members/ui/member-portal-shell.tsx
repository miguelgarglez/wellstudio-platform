'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { WellstudioLogoMark } from '@/components/brand/wellstudio-logo-mark'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/modules/auth/ui/logout-button'
import type { MemberShellSummary } from '@/modules/members/server/member-shell-summary'
import {
  isMemberPortalItemActive,
  memberPortalNavItems,
} from '@/modules/members/ui/member-portal-navigation'

type MemberPortalShellProps = {
  children: ReactNode
  summary: MemberShellSummary
}

export function MemberPortalShell({
  children,
  summary,
}: MemberPortalShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,137,197,0.08),_transparent_28%),linear-gradient(180deg,#f7f5f1_0%,#f2ede6_100%)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-8">
        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:block">
            <div className="sticky top-6 flex min-h-[calc(100vh-3rem)] flex-col rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#111317_0%,#171b21_100%)] p-5 text-white shadow-[0_26px_80px_rgba(12,14,18,0.22)]">
              <div className="space-y-5">
                <Link
                  href="/app"
                  className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/4 px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <WellstudioLogoMark className="size-12 rounded-[1.1rem] shadow-none" />
                  <div className="min-w-0">
                    <p className="font-display text-2xl uppercase tracking-[0.08em] text-white">
                      WellStudio
                    </p>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/62">
                      Portal de socio
                    </p>
                  </div>
                </Link>

                <div className="space-y-2 rounded-[1.6rem] border border-white/8 bg-white/[0.045] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">
                    Sesión activa
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-lg font-medium text-white">{summary.displayName}</p>
                    <p className="text-sm text-white/72">{summary.email}</p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs text-white/68">
                      <span className="rounded-full border border-white/10 px-2.5 py-1">
                        {summary.memberStatusLabel}
                      </span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1">
                        {summary.rolesLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <nav aria-label="Navegación privada" className="space-y-1">
                  {memberPortalNavItems.map((item) => {
                    const isActive = isMemberPortalItemActive(pathname, item)
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-[1.4rem] px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                          isActive
                            ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_26%,white_4%)] text-white'
                            : 'text-white/72 hover:bg-white/6 hover:text-white',
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.045] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">
                  Cuenta
                </p>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-white/72">{summary.email}</p>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="rounded-[2.25rem] border border-[color:color-mix(in_srgb,var(--border)_68%,white)] bg-[color:color-mix(in_srgb,var(--card)_78%,white)] px-5 py-6 shadow-[0_28px_100px_rgba(18,20,24,0.08)] sm:px-8 sm:py-8 lg:min-h-[calc(100vh-4rem)] lg:px-10 lg:py-10">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <WellstudioLogoMark className="size-11 rounded-[1rem]" />
                <div>
                  <p className="font-display text-2xl uppercase tracking-[0.08em] text-[var(--wellstudio-ink)]">
                    WellStudio
                  </p>
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_78%,white)]">
                    Portal de socio
                  </p>
                </div>
              </div>

              <main id="main-content">{children}</main>
            </div>
          </div>
        </div>
      </div>

      <nav
        aria-label="Navegación privada móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--card)_88%,white)]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 shadow-[0_-16px_40px_rgba(18,20,24,0.08)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {memberPortalNavItems.map((item) => {
            const isActive = isMemberPortalItemActive(pathname, item)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-[1.25rem] px-2 py-2 text-center text-[0.72rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  isActive
                    ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] text-[var(--wellstudio-ink)]'
                    : 'text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
