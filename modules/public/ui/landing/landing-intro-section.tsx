import Image from 'next/image'

import { cn } from '@/lib/utils'
import introTrainingImage from '@/modules/public/ui/landing/assets/intro-training.png'
import type { LandingContent } from '@/modules/public/content/landing-content'

type LandingIntroSectionProps = {
  intro: LandingContent['intro']
}

export function LandingIntroSection({
  intro,
}: LandingIntroSectionProps) {
  return (
    <section
      id="centro"
      aria-labelledby="landing-centro-heading"
      className="scroll-mt-36 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] bg-[linear-gradient(180deg,rgba(247,245,241,0.96),rgba(240,236,230,0.75))]"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            {intro.eyebrow}
          </p>
          <h2
            id="landing-centro-heading"
            className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl"
          >
            {intro.title}
          </h2>
          <p className="mt-6 text-lg leading-9 text-[color:color-mix(in_srgb,var(--wellstudio-ink)_74%,white)]">
            {intro.description}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {intro.values.map((value, index) => (
              <div
                key={value.title}
                className={cn(
                  'rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] px-4 py-4 shadow-[0_18px_36px_rgba(17,19,22,0.08)]',
                  index === 0
                    ? 'bg-[var(--wellstudio-ink)] text-white'
                    : index === 1
                      ? 'bg-[var(--wellstudio-blue-deep)] text-white shadow-[0_18px_36px_rgba(47,75,103,0.12)]'
                      : 'bg-white text-[var(--wellstudio-ink)] shadow-[0_18px_36px_rgba(17,19,22,0.05)]',
                )}
              >
                <p className="font-display text-2xl uppercase leading-none">{value.title}</p>
                <p className={cn('mt-3 text-sm leading-6', index < 2 ? 'text-white/72' : 'text-muted-foreground')}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:flex lg:h-full">
          <div className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] bg-[var(--wellstudio-ink)] shadow-[0_24px_80px_rgba(17,19,22,0.12)] lg:h-full lg:w-full">
            <Image
              src={introTrainingImage}
              alt="Entrenamiento de fuerza con mancuernas dentro del estudio"
              className="aspect-[4/4.2] h-full w-full object-cover lg:aspect-auto"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,19,22,0.02),rgba(17,19,22,0.18)_48%,rgba(17,19,22,0.72)_100%)]" />
            <div className="absolute inset-x-4 bottom-4 max-w-sm rounded-[1.5rem] border border-white/10 bg-[rgba(8,10,12,0.72)] p-5 text-white shadow-[0_18px_50px_rgba(4,5,8,0.24)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-soft)]">
                {intro.atmosphere.eyebrow}
              </p>
              <p className="mt-2 font-display text-3xl uppercase leading-none">
                {intro.atmosphere.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/74">
                {intro.atmosphere.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
