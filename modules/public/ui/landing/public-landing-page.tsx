import { cn } from '@/lib/utils'
import { landingContent } from '@/modules/public/content/landing-content'
import {
  navigationLinks,
  outlineButtonClass,
} from '@/modules/public/ui/landing/landing-config'
import { LandingContactSection } from '@/modules/public/ui/landing/landing-contact-section'
import { LandingFaqSection } from '@/modules/public/ui/landing/landing-faq-section'
import { LandingHeroSection } from '@/modules/public/ui/landing/landing-hero-section'
import { LandingIntroSection } from '@/modules/public/ui/landing/landing-intro-section'
import { LandingMethodSection } from '@/modules/public/ui/landing/landing-method-section'
import { LandingStickyHeader } from '@/modules/public/ui/landing/landing-sticky-header'
import { LandingStructuredData } from '@/modules/public/ui/landing/landing-structured-data'
import { LandingSummarySection } from '@/modules/public/ui/landing/landing-summary-section'
import { LandingTestimonialsSection } from '@/modules/public/ui/landing/landing-testimonials-section'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

export function PublicLandingPage() {
  const { hero, intro, method, pillars, testimonials, faqSection, faq, contactSection, contact } = landingContent

  return (
    <main
      id="main-content"
      className="wellstudio-landing-shell relative min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      <LandingStructuredData
        heroDescription={hero.description}
        contact={contact}
        faq={faq}
      />

      <LandingStickyHeader
        links={navigationLinks}
        loginButtonClassName={cn(
          outlineButtonClass,
          'h-10 border-white/16 bg-white/6 px-3 text-xs uppercase tracking-[0.14em] text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45 sm:h-12 sm:px-4 sm:text-sm sm:normal-case sm:tracking-normal',
        )}
      />

      <LandingHeroSection
        hero={hero}
        contact={contact}
      />
      <LandingIntroSection intro={intro} />
      <LandingMethodSection
        method={method}
        pillars={pillars}
      />
      <LandingTestimonialsSection testimonials={testimonials} />
      <LandingFaqSection
        faqSection={faqSection}
        faq={faq}
      />
      <LandingContactSection
        contactSection={contactSection}
        contact={contact}
      />
      <LandingSummarySection />

      <footer className="bg-[var(--wellstudio-ink)] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-white/10 bg-white/4 px-5 py-5 backdrop-blur-xl sm:px-6">
          <PublicSiteFooter
            className="text-white/70 [&_a]:text-white/72 [&_a:hover]:text-white [&_p:first-child]:text-[var(--wellstudio-blue-soft)]"
          />
        </div>
      </footer>
    </main>
  )
}
