'use client'

import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type AdminResponsiveDetailFrameProps = {
  isOpen: boolean
  closeHref: string
  labelledBy: string
  children: ReactNode
  className?: string
  mobileFeedback?: ReactNode
}

export function AdminResponsiveDetailFrame({
  isOpen,
  closeHref,
  labelledBy,
  children,
  className,
  mobileFeedback,
}: AdminResponsiveDetailFrameProps) {
  const router = useRouter()
  const isDesktop = useIsDesktopAdminWorkbench()

  function closeDetail() {
    router.push(closeHref)
  }

  if (isDesktop || !isOpen) {
    return (
      <section
        aria-labelledby={labelledBy}
        className={cn(
          'min-w-0 rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_16px_36px_rgba(18,20,24,0.055)] sm:p-5',
          className,
        )}
      >
        {children}
      </section>
    )
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDetail()
        }
      }}
    >
      <SheetContent
        side="right"
        aria-labelledby={labelledBy}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-[min(44rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-none border-l border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--card)_92%,white)] p-0 shadow-[0_24px_80px_rgba(18,20,24,0.2)] md:rounded-l-[1.6rem] lg:hidden"
      >
        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-14 sm:px-5">
          {mobileFeedback}
          <div className="rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_16px_36px_rgba(18,20,24,0.055)] sm:p-5">
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function useIsDesktopAdminWorkbench() {
  return useSyncExternalStore(
    subscribeToDesktopAdminWorkbench,
    getDesktopAdminWorkbenchSnapshot,
    getDesktopAdminWorkbenchServerSnapshot,
  )
}

function subscribeToDesktopAdminWorkbench(callback: () => void) {
  const mediaQuery = window.matchMedia('(min-width: 1024px)')

  mediaQuery.addEventListener('change', callback)

  return () => {
    mediaQuery.removeEventListener('change', callback)
  }
}

function getDesktopAdminWorkbenchSnapshot() {
  return window.matchMedia('(min-width: 1024px)').matches
}

function getDesktopAdminWorkbenchServerSnapshot() {
  return true
}
