'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { CalendarDays, ClipboardList, Inbox, ShieldPlus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { WellstudioLogoMark } from '@/components/brand/wellstudio-logo-mark'
import { LogoutButton } from '@/modules/auth/ui/logout-button'
import type { AdminShellSummary } from '@/modules/admin/server/admin-shell-summary'
import {
  AdminContentTransition,
  type AdminTransitionDirection,
} from '@/modules/admin/ui/admin-content-transition'
import { cn } from '@/lib/utils'

type AdminShellProps = {
  children: ReactNode
  summary: AdminShellSummary
}

const adminNavItems = [
  {
    href: '/admin',
    label: 'Reglas',
    icon: ClipboardList,
  },
  {
    href: '/admin/overrides',
    label: 'Excepciones',
    icon: ShieldPlus,
  },
  {
    href: '/admin/leads',
    label: 'Solicitudes',
    icon: Inbox,
  },
  {
    href: '/admin/sessions',
    label: 'Agenda',
    icon: CalendarDays,
  },
]

export function AdminShell({ children, summary }: AdminShellProps) {
  const pathname = usePathname()
  const navFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingTransition, setPendingTransition] = useState<{
    pathname: string
    direction: Exclude<AdminTransitionDirection, 'hold'>
  }>({
    pathname,
    direction: 'neutral',
  })
  const [navFeedbackPathname, setNavFeedbackPathname] = useState<string | null>(null)
  const contentDirection =
    pendingTransition.pathname === pathname
      ? pendingTransition.direction
      : 'hold'
  const isNavigationPending = pendingTransition.pathname !== pathname

  useEffect(() => {
    return () => {
      if (navFeedbackTimeoutRef.current) {
        clearTimeout(navFeedbackTimeoutRef.current)
      }
    }
  }, [])

  function handleAdminNavigation(targetPathname: string) {
    if (targetPathname === pathname) {
      return
    }

    if (navFeedbackTimeoutRef.current) {
      clearTimeout(navFeedbackTimeoutRef.current)
    }

    setPendingTransition({
      pathname: targetPathname,
      direction: getAdminTransitionDirection(pathname, targetPathname),
    })
    setNavFeedbackPathname(targetPathname)
    navFeedbackTimeoutRef.current = setTimeout(() => {
      setNavFeedbackPathname(null)
      navFeedbackTimeoutRef.current = null
    }, ADMIN_NAV_FEEDBACK.minimumVisibleMs)
  }

  return (
    <div className="wellstudio-admin-shell min-h-screen bg-transparent text-[var(--foreground)] xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-screen w-full flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+5.8rem)] pt-3 sm:px-5 sm:pt-5 xl:h-screen xl:px-0 xl:pb-0 xl:pt-0">
        <div className="grid flex-1 gap-4 xl:h-full xl:grid-cols-[264px_minmax(0,1fr)] xl:items-stretch xl:gap-0">
          <aside className="hidden xl:block xl:min-h-0 xl:p-4 xl:pr-0">
            <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col">
              <div className="flex min-h-0 flex-1 flex-col rounded-[1.65rem] border border-white/8 bg-[linear-gradient(180deg,#111317_0%,#171a20_100%)] p-4 text-white shadow-[0_22px_62px_rgba(17,18,22,0.18)]">
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/4 px-3 py-3">
                  <WellstudioLogoMark className="size-11 rounded-[0.9rem] shadow-none" />
                  <div className="min-w-0">
                    <p className="font-display text-[1.35rem] uppercase tracking-[0.08em] text-white">
                      WellStudio
                    </p>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/62">
                      Control admin
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 px-1">
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">
                      Operador activo
                    </p>
                    <p className="text-base font-medium text-white">{summary.displayName}</p>
                    <p className="truncate text-sm text-white/70" translate="no">
                      {summary.email}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-white/12 px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-white/72">
                    {summary.rolesLabel}
                  </span>
                </div>

                <nav aria-label="Navegación admin" className="mt-6 flex flex-col gap-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = isAdminNavItemActive(pathname, item.href)
                    const isPendingTarget =
                      (isNavigationPending && pendingTransition.pathname === item.href) ||
                      navFeedbackPathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={() => handleAdminNavigation(item.href)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'relative flex items-center gap-3 overflow-hidden rounded-[1.2rem] px-3.5 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                          isActive
                            ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white_6%)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                            : 'text-white/78 hover:bg-white/6 hover:text-white',
                          isPendingTarget
                            ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_32%,white_10%)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_10px_24px_rgba(20,24,30,0.2)]'
                            : undefined,
                        )}
                      >
                        {isPendingTarget ? (
                          <span
                            aria-hidden="true"
                            data-slot="member-portal-nav-progress"
                            className="pointer-events-none absolute inset-x-4 bottom-1.5 h-[2px] rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue-soft)_30%,transparent)]"
                          >
                            <span className="block h-full w-16 rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--wellstudio-blue)_84%,white),color-mix(in_srgb,var(--wellstudio-blue-soft)_100%,white))]" />
                          </span>
                        ) : null}
                        {isPendingTarget ? (
                          <span className="sr-only">Cargando</span>
                        ) : null}
                        <Icon className="relative z-[1] size-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="mt-auto rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-3.5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
                    Sesión
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    Cambios operativos trazables sobre reglas de dominio.
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

          <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:px-4">
            <div className="mb-5 flex items-center gap-3 rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_86%,white)] px-4 py-4 shadow-[0_18px_40px_rgba(18,20,24,0.06)] xl:hidden">
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

            <main id="main-content" className="pb-2 xl:min-h-full xl:py-4">
              <AdminContentTransition
                direction={contentDirection}
                isPending={isNavigationPending}
                pathname={pathname}
              >
                {children}
              </AdminContentTransition>
            </main>
          </div>
        </div>
      </div>

      <nav
        aria-label="Navegación admin móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--card)_88%,white)]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2.5 shadow-[0_-16px_40px_rgba(18,20,24,0.08)] backdrop-blur-xl xl:hidden"
      >
        <div className="mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-white/58 p-1.5 shadow-[0_10px_28px_rgba(18,20,24,0.07)]">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isAdminNavItemActive(pathname, item.href)
            const isPendingTarget =
              (isNavigationPending && pendingTransition.pathname === item.href) ||
              navFeedbackPathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => handleAdminNavigation(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex w-[4.7rem] min-w-0 flex-col items-center gap-1 overflow-hidden rounded-[1.45rem] px-2 py-2 text-center text-[11px] font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:w-28 sm:px-3 sm:text-xs',
                  isActive
                    ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] text-[var(--wellstudio-ink)]'
                    : 'text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]',
                  isPendingTarget
                    ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white)] text-[var(--wellstudio-ink)] shadow-[0_8px_20px_rgba(20,24,30,0.08)]'
                    : undefined,
                )}
              >
                {isPendingTarget ? (
                  <span
                    aria-hidden="true"
                    data-slot="member-portal-nav-progress"
                    className="pointer-events-none absolute inset-x-2 bottom-1 h-[2px] rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)]"
                  >
                    <span className="block h-full w-10 rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--wellstudio-blue)_84%,white),color-mix(in_srgb,var(--wellstudio-blue-soft)_100%,white))]" />
                  </span>
                ) : null}
                {isPendingTarget ? (
                  <span className="sr-only">Cargando</span>
                ) : null}
                <Icon className="relative z-[1] size-4" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

const ADMIN_NAV_FEEDBACK = {
  minimumVisibleMs: 820,
}

function isAdminNavItemActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false
  }

  if (href === '/admin') {
    return pathname === '/admin'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function getAdminTransitionDirection(
  currentPathname: string,
  targetPathname: string,
): Exclude<AdminTransitionDirection, 'hold'> {
  const currentIndex = adminNavItems.findIndex((item) =>
    isAdminNavItemActive(currentPathname, item.href),
  )
  const targetIndex = adminNavItems.findIndex((item) =>
    isAdminNavItemActive(targetPathname, item.href),
  )

  if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) {
    return 'neutral'
  }

  return targetIndex > currentIndex ? 'forward' : 'backward'
}
