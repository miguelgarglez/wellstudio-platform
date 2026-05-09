import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import methodRopeImage from '@/modules/public/ui/landing/assets/method-rope.jpeg'
import type { LandingContent, LandingPillar } from '@/modules/public/content/landing-content'

type LandingMethodSectionProps = {
  method: LandingContent['method']
  pillars: LandingPillar[]
}

export function LandingMethodSection({
  method,
  pillars,
}: LandingMethodSectionProps) {
  return (
    <section
      id="metodo"
      aria-labelledby="landing-metodo-heading"
      className="scroll-mt-36 bg-[linear-gradient(180deg,rgba(183,206,231,0.16),rgba(247,245,241,0.92))]"
    >
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            {method.eyebrow}
          </p>
          <h2
            id="landing-metodo-heading"
            className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl"
          >
            {method.title}
          </h2>
          <p className="mt-6 text-lg leading-9 text-muted-foreground">
            {method.description}
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className={cn(
                'group relative overflow-hidden rounded-[2rem] border px-6 py-6 shadow-[0_20px_50px_rgba(17,19,22,0.07)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none',
                index === 1
                  ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,var(--border))] bg-[var(--wellstudio-blue-deep)] text-white'
                  : 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] bg-white text-[var(--wellstudio-ink)]',
              )}
            >
              <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--wellstudio-blue-soft)_70%,transparent),transparent)] opacity-80" />
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    'font-display text-6xl uppercase leading-none',
                    index === 1 ? 'text-[var(--wellstudio-blue-soft)]' : 'text-[var(--wellstudio-blue)]',
                  )}
                >
                  0{index + 1}
                </span>
                <BadgeCheck
                  aria-hidden="true"
                  className={cn(
                    'size-5',
                    index === 1 ? 'text-[var(--wellstudio-blue-soft)]' : 'text-[var(--wellstudio-blue-deep)]',
                  )}
                />
              </div>
              <h3 className="mt-8 font-display text-4xl uppercase leading-[0.96] tracking-[0.03em]">
                {pillar.title}
              </h3>
              <p className={cn('mt-5 text-sm leading-8', index === 1 ? 'text-white/72' : 'text-muted-foreground')}>
                {pillar.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[var(--wellstudio-ink)] shadow-[0_24px_70px_rgba(17,19,22,0.12)]">
            <Image
              src={methodRopeImage}
              alt="Entrenamiento funcional intenso con cuerdas"
              className="aspect-[4/3.8] h-full w-full object-cover lg:aspect-[4/2.35]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,19,22,0.08),rgba(17,19,22,0.55)_80%)]" />
            <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-xl sm:flex-row">
              {method.formatBadges.map((format, index) => (
                <div
                  key={format.label}
                  className={cn(
                    'rounded-[1.25rem] border px-4 py-3 shadow-[0_18px_36px_rgba(4,6,8,0.2)] backdrop-blur-xl',
                    index === 0
                      ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_26%,transparent)] bg-[rgba(247,245,241,0.9)] text-[var(--wellstudio-ink)]'
                      : 'border-white/14 bg-[rgba(15,16,18,0.74)] text-white',
                  )}
                >
                  <p
                    className={cn(
                      'text-[0.72rem] uppercase tracking-[0.18em]',
                      index === 0 ? 'text-[var(--wellstudio-blue-deep)]' : 'text-white/58',
                    )}
                  >
                    {format.label}
                  </p>
                  <p
                    className={cn(
                      'mt-2 font-display text-2xl uppercase leading-none sm:text-3xl',
                      index === 0 ? 'text-[var(--wellstudio-blue-deep)]' : 'text-[var(--wellstudio-blue-soft)]',
                    )}
                  >
                    {format.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
