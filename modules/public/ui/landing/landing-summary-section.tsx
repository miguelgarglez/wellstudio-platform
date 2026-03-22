import { WellstudioWordmark } from '@/components/brand/wellstudio-wordmark'

export function LandingSummarySection() {
  return (
    <section
      aria-labelledby="landing-summary-heading"
      className="bg-[linear-gradient(180deg,rgba(247,245,241,0.98),rgba(232,227,220,0.85))] px-4 py-10 sm:px-6 lg:px-8 lg:py-12"
    >
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] bg-white/78 px-6 py-8 shadow-[0_24px_70px_rgba(17,19,22,0.06)] backdrop-blur-lg lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
        <div className="max-w-[22rem]">
          <WellstudioWordmark className="w-full max-w-[22rem]" />
        </div>

        <div className="mt-8 max-w-2xl lg:mt-0">
          <h2
            id="landing-summary-heading"
            className="text-balance font-display text-[2.5rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl"
          >
            Fuerza, criterio y seguimiento real
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            Un centro de entrenamiento con metodología propia, grupos reducidos y un planteamiento orientado a
            mejorar salud, rendimiento y composición corporal.
          </p>
        </div>
      </div>
    </section>
  )
}
