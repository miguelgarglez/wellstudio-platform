import { cn } from '@/lib/utils'
import type { LandingContent } from '@/modules/public/content/landing-content'

type LandingTestimonialsSectionProps = {
  testimonials: LandingContent['testimonials']
}

export function LandingTestimonialsSection({
  testimonials,
}: LandingTestimonialsSectionProps) {
  return (
    <section
      id="testimonios"
      aria-labelledby="landing-testimonios-heading"
      className="scroll-mt-36 bg-[var(--wellstudio-ink)] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex max-w-3xl flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
            {testimonials.eyebrow}
          </p>
          <h2
            id="landing-testimonios-heading"
            className="text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-white sm:text-6xl"
          >
            {testimonials.title}
          </h2>
          <p className="text-lg leading-9 text-white/68">
            {testimonials.description}
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testimonials.items.map((testimonial, index) => (
            <blockquote
              key={testimonial.author}
              className={cn(
                'rounded-[2rem] border p-6 transition-[border-color,background-color,box-shadow]',
                index === 0 ? 'order-2 lg:order-1' : index === 1 ? 'order-1 lg:order-2' : 'order-3',
                index === 1
                  ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_34%,transparent)] bg-[var(--wellstudio-blue-deep)] shadow-[0_20px_46px_rgba(13,18,24,0.18)]'
                  : 'border-white/8 bg-white/4 shadow-[0_12px_28px_rgba(5,7,9,0.1)]',
              )}
            >
              <p className="font-display text-4xl leading-none text-[var(--wellstudio-blue-soft)]">
                “
              </p>
              <p className="mt-4 text-base leading-8 text-white/78">{testimonial.quote}</p>
              <footer
                className={cn(
                  'mt-6 border-t pt-4 text-sm uppercase tracking-[0.18em]',
                  index === 1 ? 'border-white/10 text-white/58' : 'border-white/8 text-white/44',
                )}
              >
                {testimonial.author}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
