import type { LandingContent, LandingFaq } from '@/modules/public/content/landing-content'
import { LandingFaqAccordion } from '@/modules/public/ui/landing/landing-faq-accordion'

type LandingFaqSectionProps = {
  faqSection: LandingContent['faqSection']
  faq: LandingFaq[]
}

export function LandingFaqSection({
  faqSection,
  faq,
}: LandingFaqSectionProps) {
  return (
    <section
      id="faq"
      aria-labelledby="landing-faq-heading"
      className="scroll-mt-36 bg-[linear-gradient(180deg,rgba(247,245,241,1),rgba(236,230,222,0.55))]"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            {faqSection.eyebrow}
          </p>
          <h2
            id="landing-faq-heading"
            className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl"
          >
            {faqSection.title}
          </h2>
          <p className="mt-6 text-lg leading-9 text-muted-foreground">
            {faqSection.description}
          </p>
        </div>

        <LandingFaqAccordion items={faq} />
      </div>
    </section>
  )
}
