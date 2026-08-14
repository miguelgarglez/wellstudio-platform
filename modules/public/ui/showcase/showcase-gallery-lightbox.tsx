'use client'

import Image from 'next/image'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  useShowcaseGallery,
  type ShowcaseGalleryOpenOrigin,
} from '@/modules/public/ui/showcase/showcase-gallery-context'
import {
  getShowcaseShot,
  type ShowcaseShotKey,
} from '@/modules/public/ui/showcase/showcase-visuals'

const SWIPE_THRESHOLD_PX = 48
const OPEN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const OPEN_IMAGE_MS = 420
const OPEN_BACKDROP_MS = 320

/** All captures are 2880×1800 (16:10). */
const SHOT_ASPECT = 'aspect-[16/10]'

const JOURNEY_LABELS = {
  publico: 'Público',
  socio: 'Socio',
  staff: 'Staff',
} as const

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Uniform-scale FLIP between two 16:10 rects — avoids aspect-ratio squash. */
function buildFlipTransform(origin: ShowcaseGalleryOpenOrigin, target: DOMRect) {
  const scale = origin.width / target.width
  const translateX =
    origin.left + origin.width / 2 - (target.left + target.width / 2)
  const translateY =
    origin.top + origin.height / 2 - (target.top + target.height / 2)
  return `translate(${translateX}px, ${translateY}px) scale(${scale})`
}

export function ShowcaseGalleryLightbox() {
  const {
    isOpen,
    isClosing,
    currentIndex,
    order,
    openOrigin,
    close,
    finalizeClose,
    goNext,
    goPrev,
    goToIndex,
  } = useShowcaseGallery()
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const imageStageRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const hasPlayedOpenAnimation = useRef(false)
  const isAnimatingClose = useRef(false)

  useLayoutEffect(() => {
    if (!isOpen) {
      hasPlayedOpenAnimation.current = false
      return
    }
    if (isClosing || hasPlayedOpenAnimation.current) return

    const stage = imageStageRef.current
    const backdrop = backdropRef.current
    if (!stage) return

    hasPlayedOpenAnimation.current = true

    if (prefersReducedMotion()) {
      stage.style.removeProperty('transform')
      stage.style.removeProperty('opacity')
      stage.style.removeProperty('transition')
      backdrop?.style.removeProperty('opacity')
      backdrop?.style.removeProperty('transition')
      return
    }

    const targetRect = stage.getBoundingClientRect()
    const initialTransform = openOrigin
      ? buildFlipTransform(openOrigin, targetRect)
      : 'scale(0.94)'

    stage.style.transition = 'none'
    stage.style.transform = initialTransform
    stage.style.opacity = '0'

    if (backdrop) {
      backdrop.style.transition = 'none'
      backdrop.style.opacity = '0'
    }

    stage.getBoundingClientRect()

    requestAnimationFrame(() => {
      stage.style.transition = `transform ${OPEN_IMAGE_MS}ms ${OPEN_EASE}, opacity ${OPEN_IMAGE_MS - 140}ms ease-out`
      stage.style.transform = ''
      stage.style.opacity = '1'

      if (backdrop) {
        backdrop.style.transition = `opacity ${OPEN_BACKDROP_MS}ms ease-out`
        backdrop.style.opacity = '1'
      }
    })

    const timer = window.setTimeout(() => {
      stage.style.removeProperty('transition')
      backdrop?.style.removeProperty('transition')
    }, OPEN_IMAGE_MS + 40)

    return () => window.clearTimeout(timer)
  }, [isOpen, isClosing, openOrigin])

  useLayoutEffect(() => {
    if (!isClosing) {
      isAnimatingClose.current = false
      return
    }
    if (isAnimatingClose.current) return

    isAnimatingClose.current = true

    if (prefersReducedMotion()) {
      finalizeClose()
      return
    }

    const stage = imageStageRef.current
    const backdrop = backdropRef.current
    if (!stage) {
      finalizeClose()
      return
    }

    const targetRect = stage.getBoundingClientRect()
    const exitTransform = openOrigin
      ? buildFlipTransform(openOrigin, targetRect)
      : 'scale(0.94)'

    stage.style.transition = `transform ${OPEN_IMAGE_MS}ms ${OPEN_EASE}, opacity ${OPEN_IMAGE_MS - 140}ms ease-in`
    stage.style.transform = exitTransform
    stage.style.opacity = '0'

    if (backdrop) {
      backdrop.style.transition = `opacity ${OPEN_BACKDROP_MS}ms ease-in`
      backdrop.style.opacity = '0'
    }

    const timer = window.setTimeout(() => {
      finalizeClose()
    }, OPEN_IMAGE_MS + 40)

    return () => window.clearTimeout(timer)
  }, [isClosing, openOrigin, finalizeClose])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || isClosing) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isClosing, close, goNext, goPrev])

  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const panel = panelRef.current
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || focusable.length === 0) return
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    panel.addEventListener('keydown', onKeyDown)
    return () => panel.removeEventListener('keydown', onKeyDown)
  }, [isOpen, currentIndex])

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }, [])

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (isClosing) return
      const startX = touchStartX.current
      const endX = event.changedTouches[0]?.clientX
      touchStartX.current = null
      if (startX == null || endX == null) return
      const delta = endX - startX
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
      if (delta < 0) goNext()
      else goPrev()
    },
    [goNext, goPrev, isClosing],
  )

  const onBackdropClick = useCallback(() => {
    if (isClosing) return
    close()
  }, [close, isClosing])

  const stopClosePropagation = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  if (!isOpen || typeof document === 'undefined') return null

  const currentKey = order[currentIndex]
  const shot = getShowcaseShot(currentKey)
  const total = order.length

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de capturas WellStudio"
      className={cn(
        'fixed inset-0 z-[100] flex flex-col text-white',
        isClosing && 'pointer-events-none',
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Dedicated clickable backdrop — receives clicks in all non-interactive gaps. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 z-0 cursor-default bg-[rgba(8,11,15,0.92)] backdrop-blur-xl supports-backdrop-filter:backdrop-blur-2xl"
        onClick={onBackdropClick}
      />

      <header
        className="pointer-events-auto relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6"
        onClick={stopClosePropagation}
      >
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-soft)]">
            {JOURNEY_LABELS[shot.journey]} · {currentIndex + 1} / {total}
          </p>
          <p className="truncate font-display text-sm uppercase tracking-[0.06em] text-white/90 sm:text-base">
            {shot.captionTitle}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          disabled={isClosing}
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/6 p-2.5 text-white/85 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)] disabled:pointer-events-none disabled:opacity-60"
          aria-label="Cerrar galería"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 sm:px-10">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            goPrev()
          }}
          disabled={isClosing}
          className="pointer-events-auto absolute left-2 z-20 hidden rounded-full border border-white/12 bg-black/35 p-2.5 text-white/80 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)] sm:inline-flex"
          aria-label="Captura anterior"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>

        <figure className="pointer-events-none mx-auto flex max-w-[min(96rem,calc(100vw-1.5rem))] flex-col items-center">
          <div
            ref={imageStageRef}
            className={cn(
              'pointer-events-auto relative w-full origin-center will-change-[transform,opacity] motion-reduce:transition-none',
              SHOT_ASPECT,
              'max-h-[min(68svh,calc(100svh-14rem))]',
            )}
            onClick={stopClosePropagation}
          >
            <Image
              key={currentKey}
              src={shot.fullSrc}
              alt={shot.alt}
              fill
              priority
              className="object-contain motion-safe:transition-opacity motion-safe:duration-200"
              sizes="(max-width: 768px) 100vw, 92vw"
            />
          </div>
          <figcaption
            className="pointer-events-auto mt-4 w-full max-w-3xl px-2 text-center sm:mt-5"
            onClick={stopClosePropagation}
          >
            <p className="font-display text-lg uppercase tracking-[0.04em] text-white sm:text-xl">
              {shot.captionTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
              {shot.caption}
            </p>
          </figcaption>
        </figure>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            goNext()
          }}
          disabled={isClosing}
          className="pointer-events-auto absolute right-2 z-20 hidden rounded-full border border-white/12 bg-black/35 p-2.5 text-white/80 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)] sm:inline-flex"
          aria-label="Captura siguiente"
        >
          <ChevronRight className="size-6" aria-hidden="true" />
        </button>
      </div>

      <nav
        aria-label="Miniaturas de la galería"
        className="pointer-events-auto relative z-10 shrink-0 border-t border-white/8 bg-black/25 px-3 py-3 sm:px-6"
        onClick={stopClosePropagation}
      >
        <ul className="mx-auto flex max-w-5xl snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {order.map((key, index) => (
            <GalleryThumb
              key={key}
              shotKey={key}
              active={index === currentIndex}
              onSelect={() => goToIndex(index)}
            />
          ))}
        </ul>
      </nav>
    </div>,
    document.body,
  )
}

function GalleryThumb({
  shotKey,
  active,
  onSelect,
}: {
  shotKey: ShowcaseShotKey
  active: boolean
  onSelect: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const shot = getShowcaseShot(shotKey)

  useEffect(() => {
    if (!active) return
    buttonRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [active])

  return (
    <li className="shrink-0 snap-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={onSelect}
        aria-label={`Ver ${shot.captionTitle}`}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'group relative block overflow-hidden rounded-lg border transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)]',
          active
            ? 'border-[var(--wellstudio-blue)] ring-2 ring-[var(--wellstudio-blue)]/40'
            : 'border-white/12 opacity-70 hover:border-white/25 hover:opacity-100',
        )}
      >
        <div className={cn('relative w-[88px] sm:w-[104px]', SHOT_ASPECT)}>
          <Image
            src={shot.thumbSrc}
            alt=""
            fill
            className="object-cover object-left-top"
            sizes="104px"
          />
        </div>
      </button>
    </li>
  )
}
