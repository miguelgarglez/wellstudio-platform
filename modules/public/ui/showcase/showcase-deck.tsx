'use client'

import Link from 'next/link'
import { ExternalLink, Images, Presentation } from 'lucide-react'

import {
  SHOWCASE_CONTACT_MAIL,
  SHOWCASE_PREVIEW_URL,
  showcaseSlides,
} from '@/modules/public/ui/showcase/showcase-content'
import {
  ShowcaseDeckShell,
  ShowcaseHeaderLink,
  ShowcasePrimaryButton,
  ShowcaseSecondaryButton,
} from '@/modules/public/ui/showcase/showcase-deck-shell'
import { ShowcaseGalleryLightbox } from '@/modules/public/ui/showcase/showcase-gallery-lightbox'
import {
  ShowcaseGalleryProvider,
  useShowcaseGallery,
} from '@/modules/public/ui/showcase/showcase-gallery-context'
import { ShowcaseVisualPanel } from '@/modules/public/ui/showcase/showcase-visual-panel'
import type { ShowcaseSlide } from '@/modules/public/ui/showcase/showcase-content'

export function ShowcaseDeck() {
  return (
    <ShowcaseGalleryProvider>
      <ShowcaseProductDeckInner />
      <ShowcaseGalleryLightbox />
    </ShowcaseGalleryProvider>
  )
}

function ShowcaseProductDeckInner() {
  const { isOpen: galleryOpen, openGallery, registerTrigger } = useShowcaseGallery()

  return (
    <ShowcaseDeckShell
      slides={showcaseSlides}
      blockKeyboardNav={galleryOpen}
      navLabel="Slides del showcase comercial"
      headerActions={
        <>
          <button
            type="button"
            onClick={(event) => {
              registerTrigger(event.currentTarget)
              openGallery()
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/6 px-3.5 py-2 text-xs uppercase tracking-[0.16em] text-white/85 backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)]"
            aria-label="Ver galería de capturas"
          >
            Ver galería
            <Images className="size-3.5" aria-hidden="true" />
          </button>
          <ShowcaseHeaderLink href={SHOWCASE_PREVIEW_URL} external>
            Demo en vivo
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </ShowcaseHeaderLink>
          <ShowcaseHeaderLink href="/showcase/operacion">
            Cómo trabajamos
            <Presentation className="size-3.5" aria-hidden="true" />
          </ShowcaseHeaderLink>
        </>
      }
      renderVisual={(slide) => {
        const visual = (slide as ShowcaseSlide).visual
        return visual ? <ShowcaseVisualPanel visual={visual} /> : null
      }}
      renderBelowCopy={(slide) => {
        if (slide.kind === 'cta') {
          return (
            <div className="mt-8 flex flex-wrap gap-3">
              <ShowcasePrimaryButton href={SHOWCASE_PREVIEW_URL} external>
                Abrir Preview
                <ExternalLink className="size-4" aria-hidden="true" />
              </ShowcasePrimaryButton>
              <ShowcaseSecondaryButton href="/showcase/operacion">
                Cómo trabajamos
              </ShowcaseSecondaryButton>
              <ShowcaseSecondaryButton href={SHOWCASE_CONTACT_MAIL}>
                Hablemos
              </ShowcaseSecondaryButton>
            </div>
          )
        }

        if (slide.kind === 'hero') {
          return (
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/40">
              Desliza o usa ← → · Toca una captura para ampliar
            </p>
          )
        }

        if (slide.kind === 'journey' && (slide as ShowcaseSlide).visual) {
          return (
            <button
              type="button"
              onClick={(event) => {
                registerTrigger(event.currentTarget)
                openGallery()
              }}
              className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)]"
            >
              <Images className="size-3.5" aria-hidden="true" />
              Ver galería completa
            </button>
          )
        }

        return null
      }}
      renderBelowVisual={(slide) => {
        if (slide.kind === 'cta') {
          return (
            <div className="mt-4 rounded-[1.4rem] border border-white/12 bg-white/[0.04] px-5 py-4 sm:px-6 sm:py-5">
              <p className="font-display text-xl uppercase tracking-[0.04em] text-white sm:text-2xl">
                Un producto. Tres journeys.
              </p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Público · Socio · Staff. Misma marca, mismas reglas, menos fricción operativa.
              </p>
              <Link
                href="/showcase/operacion"
                className="mt-4 inline-flex text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-soft)] transition-colors hover:text-white"
              >
                Ver cómo lo operamos juntos →
              </Link>
            </div>
          )
        }

        return null
      }}
    />
  )
}
