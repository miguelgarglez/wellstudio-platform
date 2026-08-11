import Image from "next/image";
import { ArrowRight, MapPinned, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import heroBarbellImage from "@/modules/public/ui/landing/assets/hero-barbell.jpeg";
import type {
  LandingContact,
  LandingHero,
} from "@/modules/public/content/landing-content";
import {
  externalLocationLinkProps,
  heroSurfaceClass,
  outlineButtonClass,
  solidButtonClass,
} from "@/modules/public/ui/landing/landing-config";
import { LandingHeroParallaxBackdrop } from "@/modules/public/ui/landing/landing-hero-parallax-backdrop";

type LandingHeroSectionProps = {
  hero: LandingHero;
  contact: LandingContact;
};

export function LandingHeroSection({ hero, contact }: LandingHeroSectionProps) {
  const fullAddress = contact.addressLines.join(", ");

  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="relative isolate -mt-36 flex min-h-[100svh] flex-col overflow-hidden bg-[var(--wellstudio-ink)] pt-36 text-white lg:-mt-24 lg:pt-24"
    >
      <div className={cn("absolute inset-0 hidden lg:block", heroSurfaceClass)} />
      <LandingHeroParallaxBackdrop
        image={heroBarbellImage}
        alt="Barra cargada preparada para entrenamiento de fuerza"
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(183,206,231,0.55),transparent)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-10 pt-3 sm:px-6 sm:pb-12 sm:pt-4 md:pb-14 lg:px-8 lg:pb-10 lg:pt-2 [@media(max-height:820px)]:lg:pb-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-8 xl:gap-10 [@media(max-height:820px)]:lg:gap-6">
          <div className="max-w-2xl">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)] sm:text-sm">
              {hero.eyebrow}
            </p>
            <h1
              id="landing-hero-heading"
              className="mt-3 max-w-3xl text-balance font-display text-[clamp(2.35rem,8.4vw,3.35rem)] leading-[0.92] uppercase tracking-[0.03em] text-white sm:mt-4 sm:text-[3.5rem] lg:mt-4 lg:text-[clamp(2.85rem,4.1vw,4.35rem)] xl:text-[clamp(3.25rem,4vw,4.75rem)] [@media(max-height:820px)]:lg:text-[clamp(2.55rem,3.6vw,3.6rem)]"
            >
              {hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/74 sm:mt-5 sm:text-lg sm:leading-8 lg:text-[1.05rem] lg:leading-7 xl:text-lg xl:leading-8 [@media(max-height:820px)]:lg:mt-3 [@media(max-height:820px)]:lg:text-base [@media(max-height:820px)]:lg:leading-7">
              {hero.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 sm:mt-7 [@media(max-height:820px)]:lg:mt-5">
              <a
                href={hero.primaryCtaHref}
                className={cn(
                  solidButtonClass,
                  "bg-[var(--wellstudio-blue)] text-[var(--wellstudio-ink)] shadow-[0_18px_40px_rgba(79,137,197,0.28)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_88%,white)] focus-visible:ring-[var(--wellstudio-blue-soft)]",
                )}
              >
                {hero.primaryCtaLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
              <a
                href={hero.secondaryCtaHref}
                className={cn(
                  outlineButtonClass,
                  "border-white/14 bg-white/5 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45",
                )}
              >
                {hero.secondaryCtaLabel}
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 lg:hidden">
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/78 backdrop-blur-md">
                {hero.badge}
              </span>
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/78 backdrop-blur-md">
                {hero.panel.summary}
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative mx-auto h-[min(34rem,calc(100svh-10.5rem))] w-full max-w-[30rem] overflow-hidden rounded-[1.85rem] border border-white/12 bg-black/20 shadow-[0_28px_90px_rgba(5,7,9,0.36)] xl:max-w-[32rem] [@media(max-height:820px)]:h-[min(26rem,calc(100svh-9.5rem))] [@media(max-height:820px)]:max-w-[26rem]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0.02),rgba(10,12,15,0.32))]" />
              <Image
                src={heroBarbellImage}
                alt="Barra cargada preparada para entrenamiento de fuerza"
                priority
                fill
                sizes="(min-width: 1280px) 32rem, 30rem"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[rgba(7,8,11,0.78)] to-transparent" />
            </div>

            <div className="pointer-events-none absolute right-4 top-4 hidden rounded-full border border-white/14 bg-[rgba(8,10,12,0.52)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/72 backdrop-blur xl:flex">
              {hero.badge}
            </div>

            <article className="absolute inset-x-4 bottom-4 max-w-[calc(100%-2rem)] overflow-hidden rounded-[1.45rem] border border-white/12 bg-[rgba(9,11,14,0.72)] p-4 shadow-[0_18px_50px_rgba(4,5,8,0.26)] backdrop-blur-xl sm:inset-x-auto sm:left-4 sm:w-[17.5rem] xl:w-[19rem] [@media(max-height:820px)]:p-3.5">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="min-w-0">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
                    {hero.panel.eyebrow}
                  </p>
                  <p className="mt-1.5 text-balance font-display text-[1.45rem] uppercase leading-[0.92] text-white xl:text-[1.65rem] [@media(max-height:820px)]:text-[1.3rem]">
                    {hero.panel.title}
                  </p>
                </div>
                <Sparkles
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-[var(--wellstudio-blue-soft)]"
                />
              </div>

              <div className="grid gap-2.5 pt-3 text-sm leading-6 text-white/72">
                <p className="[@media(max-height:820px)]:hidden">{hero.panel.description}</p>
                <p className="rounded-[1.05rem] border border-white/10 bg-white/6 px-3 py-2 leading-5 break-words text-[0.9rem]">
                  {hero.panel.summary}
                </p>
                <a
                  href={contact.mapsHref}
                  {...externalLocationLinkProps}
                  className="inline-flex min-w-0 items-start gap-2 rounded-[1.05rem] border border-white/10 bg-white/6 px-3 py-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
                >
                  <MapPinned
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-[var(--wellstudio-blue-soft)]"
                  />
                  <span className="min-w-0 break-words leading-5 text-[0.9rem] text-white/84">
                    {fullAddress}
                  </span>
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
