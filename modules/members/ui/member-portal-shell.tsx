'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { WellstudioLogoMark } from '@/components/brand/wellstudio-logo-mark'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/modules/auth/ui/logout-button'
import type { MemberShellSummary } from '@/modules/members/server/member-shell-summary'
import { MemberPortalContentTransition } from '@/modules/members/ui/member-portal-content-transition'
import {
  getMemberPortalTransitionDirection,
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
  const [pendingTransition, setPendingTransition] = useState<{
    pathname: string
    direction: 'forward' | 'backward' | 'neutral'
  }>({
    pathname,
    direction: 'neutral',
  })
  const contentDirection =
    pendingTransition.pathname === pathname
      ? pendingTransition.direction
      : 'hold'

  function handlePortalNavigation(targetPathname: string) {
    setPendingTransition({
      pathname: targetPathname,
      direction: getMemberPortalTransitionDirection(pathname, targetPathname),
    })
  }

  return (
    <div className="min-h-screen bg-transparent text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col pb-[calc(env(safe-area-inset-bottom)+5.8rem)] lg:h-screen lg:overflow-hidden lg:pb-0">
        <div className="grid flex-1 gap-6 px-4 pt-4 sm:px-6 sm:pt-6 lg:h-screen lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-8 lg:pt-0">
          <aside className="hidden lg:block lg:h-screen">
            <div className="sticky top-0 flex h-screen flex-col py-6">
              <div className="flex h-full flex-col rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#111317_0%,#171b21_100%)] px-5 py-6 text-white">
                <div className="flex flex-1 flex-col gap-6">
                  <Link
                    href="/app"
                    prefetch={false}
                    onClick={() => handlePortalNavigation('/app')}
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

                  <div className="flex flex-col gap-3 px-1">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">
                        Sesión activa
                      </p>
                      <p className="text-lg font-medium text-white">{summary.displayName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-white/68">
                      <span className="rounded-full border border-white/10 px-2.5 py-1">
                        {summary.memberStatusLabel}
                      </span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1">
                        {summary.rolesLabel}
                      </span>
                    </div>
                  </div>

                  <nav aria-label="Navegación privada" className="flex flex-col gap-1">
                    {memberPortalNavItems.map((item) => {
                      const isActive = isMemberPortalItemActive(pathname, item)
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          onClick={() => handlePortalNavigation(item.href)}
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

                <div className="mt-auto rounded-[1.6rem] border border-white/8 bg-white/[0.045] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">
                    Cuenta
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-sm text-white/72">{summary.email}</p>
                    <LogoutButton
                      variant="ghost"
                      buttonClassName="justify-start border border-white/10 bg-white px-4 text-[var(--wellstudio-ink)] hover:bg-white/92 hover:text-[var(--wellstudio-ink)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 bg-transparent lg:h-screen lg:overflow-y-auto">
            <div className="px-1 py-2 sm:px-2 sm:py-3 lg:px-0 lg:py-0">
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

              <main id="main-content" className="pb-4 lg:px-2 lg:py-6">
                <MemberPortalContentTransition
                  direction={contentDirection}
                  pathname={pathname}
                >
                  {children}
                </MemberPortalContentTransition>
              </main>
            </div>
          </div>
        </div>
      </div>

      <nav
        aria-label="Navegación privada móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--card)_88%,white)]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2.5 shadow-[0_-16px_40px_rgba(18,20,24,0.08)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {memberPortalNavItems.map((item) => {
            const isActive = isMemberPortalItemActive(pathname, item)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => handlePortalNavigation(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-[1.25rem] px-2 py-2 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
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
