'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each state shift is tied to menu open.
 *
 *    0ms   hamburger icon rests at full opacity and scale
 *  160ms   hamburger softens out and shrinks slightly
 *  180ms   close icon scales down into place with a light blur fade
 *  200ms   popover card scales in from top-right with opacity
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  iconSwap: 180, // hamburger and close icons crossfade with blur/scale
} as const

type LandingSectionLink = {
  href: string
  label: string
}

type LandingSectionMenuProps = {
  links: readonly LandingSectionLink[]
}

export function LandingSectionMenu({
  links,
}: LandingSectionMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex justify-end lg:hidden">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label="Abrir secciones de la landing"
          className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_78%,rgba(13,15,18,0.35))] px-4 py-2.5 text-white shadow-[0_12px_32px_rgba(8,10,12,0.16)] backdrop-blur-xl transition-[background-color,border-color,transform,opacity] duration-200 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_82%,rgba(13,15,18,0.42))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 [touch-action:manipulation]"
        >
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/78 sm:text-xs">Secciones</span>
          <span
            aria-hidden="true"
            className="relative inline-flex size-4 items-center justify-center text-white/76"
          >
            <Menu
              className={cn(
                'absolute size-4 transition-[opacity,transform,filter] ease-[cubic-bezier(0.215,0.61,0.355,1)]',
                open ? 'scale-[0.85] opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0',
              )}
              style={{ transitionDuration: `${TIMING.iconSwap}ms` }}
            />
            <X
              className={cn(
                'absolute size-4 transition-[opacity,transform,filter] ease-[cubic-bezier(0.215,0.61,0.355,1)]',
                open ? 'scale-100 opacity-100 blur-0' : 'scale-[1.15] opacity-0 blur-[2px]',
              )}
              style={{ transitionDuration: `${TIMING.iconSwap}ms` }}
            />
          </span>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className={cn(
            'w-[min(18rem,calc(100vw-2rem))] rounded-[1.4rem] border-white/10 bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_84%,rgba(13,15,18,0.5))] p-3 text-white shadow-[0_18px_40px_rgba(8,10,12,0.2)] ring-white/10',
          )}
        >
          <div
            role="menu"
            aria-label="Secciones de la landing"
            className="flex flex-col gap-2"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="rounded-[1rem] border border-white/8 bg-white/5 px-3 py-2.5 text-[0.72rem] uppercase tracking-[0.18em] text-white/78 transition-[background-color,color] duration-150 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              >
                {link.label}
              </a>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
