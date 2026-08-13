'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'
import heroBarbellImage from '@/modules/public/ui/landing/assets/hero-barbell.jpeg'
import {
  SHOWCASE_CONTACT_MAIL,
  SHOWCASE_PREVIEW_URL,
  showcaseSlides,
  type ShowcaseSlide,
} from '@/modules/public/ui/showcase/showcase-content'
import { ShowcaseFrame } from '@/modules/public/ui/showcase/showcase-frames'

export function ShowcaseDeck() {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const syncActiveFromScroll = useEffectEvent(() => {
    const root = scrollerRef.current
    if (!root) return

    const slides = [...root.querySelectorAll<HTMLElement>('[data-showcase-slide]')]
    if (slides.length === 0) return

    const mid = root.scrollTop + root.clientHeight / 2
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY

    slides.forEach((slide, index) => {
      const center = slide.offsetTop + slide.offsetHeight / 2
      const dist = Math.abs(center - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = index
      }
    })

    activeIndexRef.current = best
    setActiveIndex(best)
  })

  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return

    syncActiveFromScroll()
    root.addEventListener('scroll', syncActiveFromScroll, { passive: true })
    return () => root.removeEventListener('scroll', syncActiveFromScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = activeIndexRef.current
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        goTo(current + 1)
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        goTo(current - 1)
      }
      if (event.key === 'Home') {
        event.preventDefault()
        goTo(0)
      }
      if (event.key === 'End') {
        event.preventDefault()
        goTo(showcaseSlides.length - 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function goTo(index: number) {
    const next = Math.max(0, Math.min(showcaseSlides.length - 1, index))
    const root = scrollerRef.current
    const target = root?.querySelectorAll<HTMLElement>('[data-showcase-slide]')[next]
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeIndexRef.current = next
    setActiveIndex(next)
  }

  return (
    <div className="relative h-[100svh] overflow-hidden bg-[var(--wellstudio-ink)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(79,137,197,0.22),transparent_42%),radial-gradient(circle_at_88%_78%,rgba(183,206,231,0.1),transparent_36%)]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="pointer-events-auto font-display text-sm uppercase tracking-[0.18em] text-white/90 transition-colors hover:text-white"
        >
          WellStudio
        </Link>
        <a
          href={SHOWCASE_PREVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/6 px-3.5 py-2 text-xs uppercase tracking-[0.16em] text-white/85 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Demo en vivo
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </header>

      <div
        ref={scrollerRef}
        className="relative h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {showcaseSlides.map((slide, index) => (
          <ShowcaseSlideView
            key={slide.id}
            slide={slide}
            index={index}
            active={index === activeIndex}
          />
        ))}
      </div>

      <nav
        aria-label="Slides del showcase"
        className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-2 backdrop-blur-md"
      >
        <button
          type="button"
          aria-label="Slide anterior"
          className="rounded-full p-1.5 text-white/70 transition-colors hover:text-white disabled:opacity-30"
          disabled={activeIndex === 0}
          onClick={() => goTo(activeIndex - 1)}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center gap-1.5 px-1">
          {showcaseSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir a ${slide.eyebrow}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === activeIndex ? 'w-5 bg-[var(--wellstudio-blue)]' : 'w-1.5 bg-white/35 hover:bg-white/55',
              )}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Slide siguiente"
          className="rounded-full p-1.5 text-white/70 transition-colors hover:text-white disabled:opacity-30"
          disabled={activeIndex === showcaseSlides.length - 1}
          onClick={() => goTo(activeIndex + 1)}
        >
          <ArrowRight className="size-4" />
        </button>
      </nav>
    </div>
  )
}

function ShowcaseSlideView({
  slide,
  index,
  active,
}: {
  slide: ShowcaseSlide
  index: number
  active: boolean
}) {
  return (
    <section
      data-showcase-slide={slide.id}
      aria-label={`${index + 1}. ${slide.title}`}
      className="relative flex min-h-[100svh] snap-start snap-always items-center px-4 py-24 sm:px-6 lg:px-10"
    >
      {slide.kind === 'hero' ? (
        <div className="absolute inset-0">
          <Image
            src={heroBarbellImage}
            alt=""
            fill
            priority={index === 0}
            className="object-cover opacity-35"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,18,0.55),rgba(10,14,18,0.88)_55%,rgba(10,14,18,0.96))]" />
        </div>
      ) : null}

      <div
        className={cn(
          'relative mx-auto grid w-full max-w-6xl gap-10 transition-all duration-700 ease-out lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center',
          active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-55',
        )}
      >
        <div className="max-w-2xl">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
            {slide.eyebrow}
          </p>
          <h1
            className={cn(
              'mt-3 text-balance font-display uppercase tracking-[0.03em] text-white',
              slide.kind === 'hero'
                ? 'text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.92]'
                : 'text-[clamp(2rem,5.2vw,3.4rem)] leading-[0.95]',
            )}
          >
            {slide.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
            {slide.body}
          </p>

          {slide.bullets ? (
            <ul className="mt-6 space-y-2.5">
              {slide.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm leading-6 text-white/78 sm:text-base"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--wellstudio-blue)]"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {slide.kind === 'cta' ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={SHOWCASE_PREVIEW_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--wellstudio-blue)] px-5 py-3 text-sm font-medium text-[var(--wellstudio-ink)] transition-transform hover:scale-[1.02]"
              >
                Abrir Preview
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
              <a
                href={SHOWCASE_CONTACT_MAIL}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/8"
              >
                Hablemos
              </a>
            </div>
          ) : null}

          {slide.kind === 'hero' ? (
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/40">
              Desliza o usa ← →
            </p>
          ) : null}
        </div>

        <div className="relative">
          {slide.frame ? <ShowcaseFrame variant={slide.frame} /> : null}
          {slide.demoPlaceholder ? (
            <p className="mt-3 text-center text-[0.7rem] uppercase tracking-[0.18em] text-white/40">
              {slide.demoPlaceholder}
            </p>
          ) : null}
          {slide.kind === 'cta' ? (
            <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-6 sm:p-8">
              <p className="font-display text-2xl uppercase tracking-[0.04em] text-white sm:text-3xl">
                Un producto. Tres journeys.
              </p>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Público · Socio · Staff. Misma marca, mismas reglas, menos fricción operativa.
              </p>
              <p className="mt-8 text-[0.7rem] leading-5 text-white/35">
                Producto diseñado y construido por Miguel García — monolito Next.js.
              </p>
            </div>
          ) : null}
          {slide.kind === 'copy' || slide.kind === 'outcome' ? (
            <div
              aria-hidden="true"
              className="hidden min-h-48 rounded-[1.6rem] border border-white/8 bg-[linear-gradient(145deg,rgba(79,137,197,0.16),rgba(255,255,255,0.03))] lg:block"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
