'use client'

import Image from 'next/image'
import { Maximize2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useShowcaseGallery } from '@/modules/public/ui/showcase/showcase-gallery-context'
import {
  getShowcaseShot,
  type ShowcaseShotKey,
  type ShowcaseVisualSpec,
} from '@/modules/public/ui/showcase/showcase-visuals'

/** All captures are 2880×1800 (16:10). */
const SHOT_ASPECT = 'aspect-[16/10]'

type ShowcaseVisualPanelProps = {
  visual: ShowcaseVisualSpec
  className?: string
}

export function ShowcaseVisualPanel({ visual, className }: ShowcaseVisualPanelProps) {
  const chrome = visual.chrome ?? false

  switch (visual.layout) {
    case 'single':
      return (
        <FrameShell chrome={chrome} className={className}>
          <ShotImage shot={visual.shots[0]} priority={visual.priority} />
        </FrameShell>
      )
    case 'duo':
      return (
        <div className={cn('grid gap-3 sm:grid-cols-2 sm:gap-4', className)}>
          {visual.shots.slice(0, 2).map((key) => (
            <FrameShell key={key} chrome={chrome}>
              <ShotImage shot={key} />
            </FrameShell>
          ))}
        </div>
      )
    case 'trio':
      return (
        <ScrollStrip className={className} columns={3}>
          {visual.shots.slice(0, 3).map((key) => (
            <StripCell key={key} columns={3}>
              <FrameShell chrome={chrome}>
                <ShotImage shot={key} priority={visual.priority} />
              </FrameShell>
            </StripCell>
          ))}
        </ScrollStrip>
      )
    case 'quad':
      return (
        <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', className)}>
          {visual.shots.slice(0, 4).map((key) => (
            <FrameShell key={key} chrome={chrome}>
              <ShotImage shot={key} />
            </FrameShell>
          ))}
        </div>
      )
    case 'hero-stack': {
      const primary = visual.primary ?? visual.shots[0]
      const secondary = visual.shots.filter((key) => key !== primary)
      return (
        <div className={cn('space-y-3 sm:space-y-4', className)}>
          <FrameShell chrome={chrome} className="shadow-[0_32px_90px_rgba(0,0,0,0.5)]">
            <ShotImage shot={primary} priority={visual.priority} />
          </FrameShell>
          {secondary.length > 0 ? (
            <ScrollStrip columns={Math.min(secondary.length, 3) as 2 | 3}>
              {secondary.map((key) => (
                <StripCell key={key} columns={Math.min(secondary.length, 3) as 2 | 3}>
                  <FrameShell chrome={chrome}>
                    <ShotImage shot={key} />
                  </FrameShell>
                </StripCell>
              ))}
            </ScrollStrip>
          ) : null}
        </div>
      )
    }
    case 'strip':
    case 'mosaic':
      return (
        <ScrollStrip className={className}>
          {visual.shots.map((key, index) => (
            <StripCell key={key}>
              <FrameShell chrome={chrome}>
                <ShotImage shot={key} priority={visual.priority && index === 0} />
              </FrameShell>
            </StripCell>
          ))}
        </ScrollStrip>
      )
  }
}

function ScrollStrip({
  children,
  className,
  columns,
}: {
  children: ReactNode
  className?: string
  columns?: 2 | 3
}) {
  return (
    <div
      className={cn(
        '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        columns === 2 && 'lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0',
        columns === 3 && 'lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-3.5 lg:overflow-visible lg:px-0 lg:pb-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

function StripCell({
  children,
  columns,
}: {
  children: ReactNode
  columns?: 2 | 3
}) {
  return (
    <div
      className={cn(
        'w-[min(82vw,360px)] shrink-0 snap-center',
        columns ? 'lg:w-auto lg:min-w-0' : 'lg:w-[min(42vw,420px)]',
      )}
    >
      {children}
    </div>
  )
}

function FrameShell({
  children,
  chrome = false,
  className,
}: {
  children: ReactNode
  chrome?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'group/frame overflow-hidden border border-white/12 bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_90%,#1a2430)] shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_20px_56px_rgba(0,0,0,0.45)]',
        className,
      )}
    >
      {chrome ? (
        <div className="flex items-center gap-1 border-b border-white/8 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-white/20" />
          <span className="size-1.5 rounded-full bg-white/14" />
          <span className="size-1.5 rounded-full bg-white/10" />
        </div>
      ) : null}
      <div className="relative overflow-hidden bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_82%,#243040)]">
        {children}
      </div>
    </div>
  )
}

function ShotImage({
  shot,
  priority = false,
}: {
  shot: ShowcaseShotKey
  priority?: boolean
}) {
  const { openAt, registerTrigger } = useShowcaseGallery()
  const { thumbSrc, alt, label, captionTitle } = getShowcaseShot(shot)

  return (
    <button
      type="button"
      onClick={(event) => {
        registerTrigger(event.currentTarget)
        openAt(shot)
      }}
      className={cn(
        'group/shot relative block w-full cursor-zoom-in text-left',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)]',
      )}
      aria-label={`Ampliar: ${captionTitle}`}
    >
      <div className={cn('relative w-full', SHOT_ASPECT)}>
        <Image
          src={thumbSrc}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="object-contain object-left-top p-0.5 transition-transform duration-500 ease-out group-hover/shot:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover/shot:scale-100"
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 42vw, 28vw"
        />
        <span className="pointer-events-none absolute inset-0 flex items-end justify-end p-2 opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/shot:opacity-100 [@media(hover:hover)]:group-focus-visible/shot:opacity-100 motion-reduce:transition-none">
          <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/90 backdrop-blur-sm">
            <Maximize2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
        </span>
      </div>
      <span className="sr-only">{label}</span>
    </button>
  )
}
