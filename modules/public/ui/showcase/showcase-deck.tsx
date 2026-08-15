'use client'

import Link from 'next/link'
import { ExternalLink, Images, Presentation } from 'lucide-react'

import {
  SHOWCASE_CONTACT_MAIL,
  SHOWCASE_PREVIEW_URL,
  showcaseSlides,
  type ShowcaseSlide,
} from '@/modules/public/ui/showcase/showcase-content'
import {
  ShowcaseDeckShell,
  ShowcaseHeaderButton,
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
          <ShowcaseHeaderButton
            label="Galería"
            aria-label="Ver galería de capturas"
            onClick={(event) => {
              registerTrigger(event.currentTarget)
              openGallery()
            }}
          >
            <Images className="size-3.5" aria-hidden="true" />
          </ShowcaseHeaderButton>
          <ShowcaseHeaderLink href={SHOWCASE_PREVIEW_URL} label="Demo" external>
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </ShowcaseHeaderLink>
          <ShowcaseHeaderLink href="/showcase/operacion" label="Operación">
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
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
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
            <p className="mt-6 text-[0.65rem] uppercase tracking-[0.18em] text-white/40 sm:mt-8 sm:text-xs sm:tracking-[0.2em]">
              <span className="sm:hidden">Desliza · Toca una captura para ampliar</span>
              <span className="hidden sm:inline">
                Desliza o usa ← → · Toca una captura para ampliar
              </span>
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
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wellstudio-blue)] sm:mt-6"
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
            <div className="mt-3 rounded-[1.2rem] border border-white/12 bg-white/[0.04] px-4 py-4 sm:mt-4 sm:rounded-[1.4rem] sm:px-6 sm:py-5">
              <p className="font-display text-lg uppercase tracking-[0.04em] text-white sm:text-2xl">
                Un producto. Tres journeys.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65 sm:leading-7">
                Público · Socio · Staff. Misma marca, mismas reglas, menos fricción operativa.
              </p>
              <Link
                href="/showcase/operacion"
                className="mt-3 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-soft)] transition-colors hover:text-white sm:mt-4"
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
