import Image from 'next/image'
import { ArrowRight, MapPinned, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import heroBarbellImage from '@/modules/public/ui/landing/assets/hero-barbell.jpeg'
import type { LandingContact, LandingHero } from '@/modules/public/content/landing-content'
import {
  externalLocationLinkProps,
  heroSurfaceClass,
  outlineButtonClass,
  solidButtonClass,
} from '@/modules/public/ui/landing/landing-config'

type LandingHeroSectionProps = {
  hero: LandingHero
  contact: LandingContact
}

export function LandingHeroSection({
  hero,
  contact,
}: LandingHeroSectionProps) {
  const fullAddress = contact.addressLines.join(', ')

  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="relative isolate -mt-36 overflow-hidden bg-[var(--wellstudio-ink)] pt-36 text-white lg:-mt-24 lg:pt-24"
    >
      <div className={cn('absolute inset-0', heroSurfaceClass)} />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(183,206,231,0.55),transparent)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-7 sm:px-6 md:pb-20 lg:px-8 lg:pb-24">
        <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:pt-20">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
              {hero.eyebrow}
            </p>
            <h1
              id="landing-hero-heading"
              className="mt-5 max-w-4xl text-balance font-display text-[3.35rem] leading-[0.92] uppercase tracking-[0.03em] text-white sm:text-7xl lg:text-[6.35rem]"
            >
              {hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              {hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={hero.primaryCtaHref}
                className={cn(
                  solidButtonClass,
                  'bg-[var(--wellstudio-blue)] text-[var(--wellstudio-ink)] shadow-[0_18px_40px_rgba(79,137,197,0.28)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_88%,white)] focus-visible:ring-[var(--wellstudio-blue-soft)]',
                )}
              >
                {hero.primaryCtaLabel}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4"
                />
              </a>
              <a
                href={hero.secondaryCtaHref}
                className={cn(
                  outlineButtonClass,
                  'border-white/14 bg-white/5 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45',
                )}
              >
                {hero.secondaryCtaLabel}
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/12 bg-black/20 shadow-[0_28px_90px_rgba(5,7,9,0.36)]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0.02),rgba(10,12,15,0.32))]" />
              <Image
                src={heroBarbellImage}
                alt="Barra cargada preparada para entrenamiento de fuerza"
                priority
                className="aspect-[4/4.6] h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[rgba(7,8,11,0.78)] to-transparent" />
            </div>

            <div className="pointer-events-none absolute right-4 top-4 hidden rounded-full border border-white/14 bg-[rgba(8,10,12,0.52)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/72 backdrop-blur sm:flex">
              {hero.badge}
            </div>

            <article className="absolute inset-x-4 bottom-4 max-w-[calc(100%-2rem)] overflow-hidden rounded-[1.65rem] border border-white/12 bg-[rgba(9,11,14,0.72)] p-5 shadow-[0_18px_50px_rgba(4,5,8,0.26)] backdrop-blur-xl sm:inset-x-auto sm:left-4 sm:w-[18rem] md:w-[21rem] lg:w-[20rem] xl:w-[21rem]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
                    {hero.panel.eyebrow}
                  </p>
                  <p className="mt-2 text-balance font-display text-[1.8rem] uppercase leading-[0.92] text-white sm:text-3xl">
                    {hero.panel.title}
                  </p>
                </div>
                <Sparkles
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-[var(--wellstudio-blue-soft)]"
                />
              </div>

              <div className="grid gap-3 pt-4 text-sm leading-7 text-white/72">
                <p className="hidden sm:block">{hero.panel.description}</p>
                <p className="rounded-[1.15rem] border border-white/10 bg-white/6 px-3 py-2 leading-6 break-words">
                  {hero.panel.summary}
                </p>
                <a
                  href={contact.mapsHref}
                  {...externalLocationLinkProps}
                  className="inline-flex min-w-0 items-start gap-2 rounded-[1.15rem] border border-white/10 bg-white/6 px-3 py-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
                >
                  <MapPinned
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-[var(--wellstudio-blue-soft)]"
                  />
                  <span className="min-w-0 break-words leading-6 text-white/84">
                    {fullAddress}
                  </span>
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
