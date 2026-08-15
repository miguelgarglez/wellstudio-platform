'use client'

import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import heroBarbellImage from '@/modules/public/ui/landing/assets/hero-barbell.jpeg'
import type { DeckSlide } from '@/modules/public/ui/showcase/showcase-deck-types'

export type ShowcaseDeckShellProps = {
  slides: DeckSlide[]
  navLabel?: string
  heroImage?: StaticImageData
  headerActions?: ReactNode
  blockKeyboardNav?: boolean
  /** On small screens, put copy above the visual (better for dense diagrams). Desktop unchanged. */
  mobileCopyFirst?: boolean
  renderVisual?: (slide: DeckSlide, index: number) => ReactNode
  renderBelowCopy?: (slide: DeckSlide, index: number) => ReactNode
  renderBelowVisual?: (slide: DeckSlide, index: number) => ReactNode
}

export function ShowcaseDeckShell({
  slides,
  navLabel = 'Slides del showcase',
  heroImage = heroBarbellImage,
  headerActions,
  blockKeyboardNav = false,
  mobileCopyFirst = false,
  renderVisual,
  renderBelowCopy,
  renderBelowVisual,
}: ShowcaseDeckShellProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const syncActiveFromScroll = useEffectEvent(() => {
    const root = scrollerRef.current
    if (!root) return

    const slideElements = [...root.querySelectorAll<HTMLElement>('[data-showcase-slide]')]
    if (slideElements.length === 0) return

    const mid = root.scrollTop + root.clientHeight / 2
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY

    slideElements.forEach((slide, index) => {
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

  function goTo(index: number) {
    const next = Math.max(0, Math.min(slides.length - 1, index))
    const root = scrollerRef.current
    const target = root?.querySelectorAll<HTMLElement>('[data-showcase-slide]')[next]
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeIndexRef.current = next
    setActiveIndex(next)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (blockKeyboardNav) return
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
        goTo(slides.length - 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [blockKeyboardNav, slides.length])

  return (
    <div className="relative h-[100svh] overflow-hidden bg-[var(--wellstudio-ink)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(79,137,197,0.22),transparent_42%),radial-gradient(circle_at_88%_78%,rgba(183,206,231,0.1),transparent_36%)]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:items-center sm:px-6 sm:py-4 lg:px-8">
        <Link
          href="/"
          className="pointer-events-auto shrink-0 pt-1.5 font-display text-xs uppercase tracking-[0.18em] text-white/90 transition-colors hover:text-white sm:pt-0 sm:text-sm"
        >
          WellStudio
        </Link>
        {headerActions ? (
          <div className="pointer-events-auto flex max-w-[min(100%,18.5rem)] flex-wrap items-center justify-end gap-1.5 sm:max-w-none sm:gap-2">
            {headerActions}
          </div>
        ) : null}
      </header>

      <div
        ref={scrollerRef}
        className="relative h-full snap-y snap-proximity overflow-y-auto overscroll-y-contain scroll-smooth lg:snap-mandatory"
      >
        {slides.map((slide, index) => (
          <DeckSlideView
            key={slide.id}
            slide={slide}
            index={index}
            active={index === activeIndex}
            heroImage={heroImage}
            mobileCopyFirst={mobileCopyFirst}
            renderVisual={renderVisual}
            renderBelowCopy={renderBelowCopy}
            renderBelowVisual={renderBelowVisual}
          />
        ))}
      </div>

      <nav
        aria-label={navLabel}
        className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/12 bg-black/45 px-2.5 py-1.5 backdrop-blur-md sm:bottom-5 sm:gap-2 sm:px-3 sm:py-2"
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
          {slides.map((slide, index) => (
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
          disabled={activeIndex === slides.length - 1}
          onClick={() => goTo(activeIndex + 1)}
        >
          <ArrowRight className="size-4" />
        </button>
      </nav>
    </div>
  )
}

function DeckSlideView({
  slide,
  index,
  active,
  heroImage,
  mobileCopyFirst,
  renderVisual,
  renderBelowCopy,
  renderBelowVisual,
}: {
  slide: DeckSlide
  index: number
  active: boolean
  heroImage: StaticImageData
  mobileCopyFirst: boolean
  renderVisual?: (slide: DeckSlide, index: number) => ReactNode
  renderBelowCopy?: (slide: DeckSlide, index: number) => ReactNode
  renderBelowVisual?: (slide: DeckSlide, index: number) => ReactNode
}) {
  const visual = renderVisual?.(slide, index)
  // Product deck: screenshots first on mobile. Operation deck: copy first (dense diagrams).
  const visualFirstOnMobile = slide.kind !== 'hero' && !mobileCopyFirst

  return (
    <section
      data-showcase-slide={slide.id}
      aria-label={`${index + 1}. ${slide.title}`}
      className="relative flex min-h-[100svh] snap-start snap-always items-center px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(4.75rem+env(safe-area-inset-top))] sm:px-6 sm:py-24 lg:px-10"
    >
      {slide.kind === 'hero' ? (
        <div className="absolute inset-0">
          <Image
            src={heroImage}
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
          'relative mx-auto grid w-full max-w-[90rem] gap-5 transition-all duration-700 ease-out sm:gap-8 lg:items-center lg:gap-10',
          visual
            ? 'lg:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)]'
            : 'max-w-6xl lg:grid-cols-1',
          active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-55',
        )}
      >
        <div
          className={cn(
            visual ? 'max-w-lg lg:max-w-none' : 'max-w-2xl',
            visualFirstOnMobile && visual ? 'order-2 lg:order-1' : 'order-1',
          )}
        >
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-soft)] sm:text-[0.72rem] sm:tracking-[0.22em]">
            {slide.eyebrow}
          </p>
          <h1
            className={cn(
              'mt-2.5 text-balance font-display uppercase tracking-[0.03em] text-white sm:mt-3',
              slide.kind === 'hero'
                ? 'text-[clamp(1.85rem,8.2vw,4.6rem)] leading-[0.94]'
                : 'text-[clamp(1.55rem,6.4vw,3.4rem)] leading-[0.98]',
            )}
          >
            {slide.title}
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-white/72 sm:mt-4 sm:text-lg sm:leading-8">
            {slide.body}
          </p>

          {slide.bullets ? (
            <ul className="mt-5 space-y-2 sm:mt-6 sm:space-y-2.5">
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

          {renderBelowCopy?.(slide, index)}

        </div>

        {visual ? (
          <div
            className={cn(
              'relative w-full min-w-0',
              visualFirstOnMobile ? 'order-1 lg:order-2' : 'order-2',
              slide.kind === 'hero' && 'mt-1 sm:mt-2 lg:mt-0',
            )}
          >
            {visual}
            {slide.demoPlaceholder ? (
              <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.16em] text-white/40 sm:text-[0.7rem] sm:tracking-[0.18em]">
                {slide.demoPlaceholder}
              </p>
            ) : null}
            {renderBelowVisual?.(slide, index)}
          </div>
        ) : null}
      </div>
    </section>
  )
}

const headerLinkClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-white/18 bg-white/6 px-2.5 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)] sm:gap-2 sm:px-3.5 sm:text-xs sm:tracking-[0.16em]'

export function ShowcaseHeaderLink({
  href,
  children,
  label,
  external,
}: {
  href: string
  children: ReactNode
  /** Visible label; hide on the narrowest phones when paired with an icon child. */
  label?: string
  external?: boolean
}) {
  const content = (
    <>
      {label ? <span className="max-[380px]:sr-only">{label}</span> : null}
      {children}
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={headerLinkClassName}>
        {label ? content : children}
      </a>
    )
  }

  return (
    <Link href={href} className={headerLinkClassName}>
      {label ? content : children}
    </Link>
  )
}

export function ShowcaseHeaderButton({
  children,
  label,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  label?: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={headerLinkClassName}
    >
      {label ? <span className="max-[380px]:sr-only">{label}</span> : null}
      {children}
    </button>
  )
}

const ctaPrimaryClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--wellstudio-blue)] px-5 py-3.5 text-sm font-medium text-[var(--wellstudio-ink)] transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:py-3'

const ctaSecondaryClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/8 active:bg-white/10 sm:w-auto sm:py-3'

export function ShowcasePrimaryButton({
  href,
  children,
  external,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={ctaPrimaryClassName}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={ctaPrimaryClassName}>
      {children}
    </Link>
  )
}

export function ShowcaseSecondaryButton({
  href,
  children,
  external,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={ctaSecondaryClassName}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={ctaSecondaryClassName}>
      {children}
    </Link>
  )
}
