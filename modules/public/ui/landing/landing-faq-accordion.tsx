'use client'

import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'

import type { LandingFaq } from '@/modules/public/content/landing-content'

/* ─────────────────────────────────────────────────────────
 * FAQ INTERACTION STORYBOARD
 *
 * Read top-to-bottom. Each interaction uses the same timing.
 *
 *    0ms   user toggles an FAQ row
 *  120ms   chevron rotates toward the active state
 *  220ms   panel expands/collapses its content height
 *  260ms   answer copy fades into its resting state
 * ───────────────────────────────────────────────────────── */

const FAQ_MOTION = {
  chevronMs: 120, // chevron snaps into the new direction
  panelMs: 220, // content height expands or collapses
  contentMs: 260, // answer copy fades/slides into place
  offsetY: 8, // answer copy settles from a subtle offset
}

type LandingFaqAccordionProps = {
  items: LandingFaq[]
}

export function LandingFaqAccordion({ items }: LandingFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0)
  const idPrefix = useId()

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const panelId = `${idPrefix}-panel-${index}`
        const buttonId = `${idPrefix}-button-${index}`

        return (
          <article
            key={item.question}
            className="group rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(17,19,22,0.05)]"
          >
            <button
              id={buttonId}
              type="button"
              aria-controls={panelId}
              aria-expanded={isOpen}
              onClick={() => {
                setOpenIndex((currentIndex) =>
                  currentIndex === index ? -1 : index,
                )
              }}
              className="flex w-full cursor-pointer items-start justify-between gap-4 rounded-[1.2rem] py-1 text-left font-display text-3xl uppercase leading-[0.98] tracking-[0.03em] text-[var(--wellstudio-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]/55"
            >
              <span className="text-balance">{item.question}</span>
              <ChevronRight
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 transition-transform duration-150 motion-reduce:transition-none"
                style={{
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
              }}
            >
              <div className="overflow-hidden">
                <p
                  className="max-w-3xl pt-4 text-base leading-8 text-muted-foreground transition-[opacity,transform] duration-[260ms] motion-reduce:transition-none"
                  style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen
                      ? 'translateY(0px)'
                      : `translateY(${FAQ_MOTION.offsetY}px)`,
                  }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
