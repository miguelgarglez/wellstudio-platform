'use client'

import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type AdminTransitionDirection = 'forward' | 'backward' | 'neutral' | 'hold'

/* ─────────────────────────────────────────────────────────
 * ADMIN TRANSITION STORYBOARD
 *
 * Read top-to-bottom. Each `at` value is ms after pathname changes.
 *
 *    0ms   nav item acknowledges the target route immediately
 *    0ms   current panel quiets down with opacity + scale while waiting
 *    0ms   incoming panel starts offset 25px on the travel axis
 *   90ms   opacity is nearly restored and movement is mostly settled
 *  300ms   panel reaches rest and motion disappears
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  duration: 300,
  distance: 25,
}

type AdminContentTransitionProps = {
  children: ReactNode
  className?: string
  direction: AdminTransitionDirection
  isPending: boolean
  pathname: string
}

export function AdminContentTransition({
  children,
  className,
  direction,
  isPending,
  pathname,
}: AdminContentTransitionProps) {
  const animationStyle = {
    '--admin-panel-duration': `${TIMING.duration}ms`,
    '--admin-panel-distance': `${TIMING.distance}px`,
  } as CSSProperties

  return (
    <div
      key={pathname}
      data-slot="admin-content"
      data-direction={direction}
      data-pending={isPending ? 'true' : 'false'}
      className={cn('wellstudio-admin-content-animate relative', className)}
      style={animationStyle}
    >
      <div data-slot="admin-content-inner">{children}</div>
    </div>
  )
}
