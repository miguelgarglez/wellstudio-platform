'use client'

import { ExternalLink, Images } from 'lucide-react'

import {
  SHOWCASE_CONTACT_MAIL,
  SHOWCASE_PREVIEW_URL,
} from '@/modules/public/ui/showcase/showcase-content'
import {
  ShowcaseDeckShell,
  ShowcaseHeaderLink,
  ShowcasePrimaryButton,
  ShowcaseSecondaryButton,
} from '@/modules/public/ui/showcase/showcase-deck-shell'
import {
  operationSlides,
  type OperationSlide,
} from '@/modules/public/ui/showcase/showcase-operation-content'
import { ShowcaseOperationPanel } from '@/modules/public/ui/showcase/showcase-operation-panel'

export function ShowcaseOperationDeck() {
  return (
    <ShowcaseDeckShell
      slides={operationSlides}
      mobileCopyFirst
      navLabel="Slides del modelo operativo"
      headerActions={
        <>
          <ShowcaseHeaderLink href="/showcase" label="Producto">
            <Images className="size-3.5" aria-hidden="true" />
          </ShowcaseHeaderLink>
          <ShowcaseHeaderLink href={SHOWCASE_PREVIEW_URL} label="Demo" external>
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </ShowcaseHeaderLink>
        </>
      }
      renderVisual={(slide) => {
        const visual = (slide as OperationSlide).visual
        return visual ? <ShowcaseOperationPanel layout={visual} /> : null
      }}
      renderBelowCopy={(slide) => {
        if (slide.kind === 'hero') {
          return (
            <p className="mt-6 text-[0.65rem] uppercase tracking-[0.18em] text-white/40 sm:mt-8 sm:text-xs sm:tracking-[0.2em]">
              <span className="sm:hidden">Desliza para seguir</span>
              <span className="hidden sm:inline">Desliza o usa ← →</span>
            </p>
          )
        }

        if (slide.kind === 'cta') {
          return (
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <ShowcasePrimaryButton href="/showcase">
                Ver capturas del producto
              </ShowcasePrimaryButton>
              <ShowcaseSecondaryButton href={SHOWCASE_PREVIEW_URL} external>
                Probar demo en vivo
                <ExternalLink className="size-4" aria-hidden="true" />
              </ShowcaseSecondaryButton>
              <ShowcaseSecondaryButton href={SHOWCASE_CONTACT_MAIL}>
                Hablemos
              </ShowcaseSecondaryButton>
            </div>
          )
        }

        return null
      }}
      renderBelowVisual={(slide) => {
        if (slide.kind === 'cta') {
          return (
            <div className="mt-3 rounded-[1.2rem] border border-white/12 bg-white/[0.04] px-4 py-4 sm:mt-4 sm:rounded-[1.4rem] sm:px-6 sm:py-5">
              <p className="font-display text-lg uppercase tracking-[0.04em] text-white sm:text-2xl">
                Lo que recomendamos
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65 sm:leading-7">
                Un solo contacto, arranque por fases y sin sorpresas. Vuestro equipo se centra en el
                centro; nosotros en que el software no falle.
              </p>
            </div>
          )
        }

        return null
      }}
    />
  )
}
