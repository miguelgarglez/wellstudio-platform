import Image from 'next/image'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Dumbbell,
  Mail,
  MapPinned,
  MoveUpRight,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react'

import { WellstudioWordmark } from '@/components/brand/wellstudio-wordmark'
import { cn } from '@/lib/utils'
import heroBarbellImage from '@/modules/public/ui/landing/assets/hero-barbell.jpeg'
import introTrainingImage from '@/modules/public/ui/landing/assets/intro-training.png'
import methodRopeImage from '@/modules/public/ui/landing/assets/method-rope.jpeg'
import { landingContent } from '@/modules/public/content/landing-content'
import { LandingFaqAccordion } from '@/modules/public/ui/landing/landing-faq-accordion'
import { LandingStickyHeader } from '@/modules/public/ui/landing/landing-sticky-header'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

const navigationLinks = [
  { href: '#centro', label: 'Centro' },
  { href: '#metodo', label: 'Método' },
  { href: '#testimonios', label: 'Testimonios' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contacto', label: 'Contacto' },
] as const

const highlightIcons = [Users, Dumbbell, Clock3, MapPinned]

const externalLocationLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const

const baseButtonClass =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 active:translate-y-px'

const solidButtonClass = `${baseButtonClass} h-12 rounded-full px-6 text-sm font-medium`

const outlineButtonClass =
  `${baseButtonClass} h-12 rounded-full border px-6 text-sm font-medium`

const heroSurfaceClass =
  'bg-[radial-gradient(circle_at_top_left,rgba(79,137,197,0.32),transparent_24%),radial-gradient(circle_at_78%_12%,rgba(183,206,231,0.14),transparent_22%),linear-gradient(180deg,rgba(15,16,18,0.98),rgba(15,16,18,0.92))]'

export function PublicLandingPage() {
  const { hero, intro, highlights, method, pillars, testimonials, faqSection, faq, contactSection, contact } =
    landingContent
  const fullAddress = contact.addressLines.join(', ')

  return (
    <main
      id="main-content"
      className="wellstudio-landing-shell relative min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      <LandingStickyHeader
        links={navigationLinks}
        loginButtonClassName={cn(
          outlineButtonClass,
          'h-10 border-white/16 bg-white/6 px-3 text-xs uppercase tracking-[0.14em] text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45 sm:h-12 sm:px-4 sm:text-sm sm:normal-case sm:tracking-normal',
        )}
      />

      <section className="relative isolate -mt-36 overflow-hidden bg-[var(--wellstudio-ink)] pt-36 text-white lg:-mt-24 lg:pt-24">
        <div className={cn('absolute inset-0', heroSurfaceClass)} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(183,206,231,0.55),transparent)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-7 sm:px-6 md:pb-20 lg:px-8 lg:pb-24">
          <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:pt-20">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">{hero.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-balance font-display text-[3.35rem] leading-[0.92] uppercase tracking-[0.03em] text-white sm:text-7xl lg:text-[6.35rem]">
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
                  <p>{hero.panel.description}</p>
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
                    <span className="min-w-0 break-words leading-6 text-white/84">{fullAddress}</span>
                  </a>
                </div>
              </article>
            </div>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {highlights.map((highlight, index) => {
              const Icon = highlightIcons[index]
              const isLocationCard = highlight.label === 'Ubicación'
              const content = (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                      <Icon
                        aria-hidden="true"
                        className="size-4 text-[var(--wellstudio-blue-soft)]"
                      />
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/58">{highlight.label}</p>
                  </div>
                  <p className="mt-4 font-display text-4xl uppercase leading-none text-white">{highlight.value}</p>
                  <p className="mt-3 text-sm leading-7 text-white/68">{highlight.description}</p>
                </>
              )

              if (isLocationCard) {
                return (
                  <a
                    key={highlight.label}
                    href={contact.mapsHref}
                    {...externalLocationLinkProps}
                    className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_74%,black)] px-4 py-4 shadow-[0_18px_40px_rgba(8,11,15,0.22)] backdrop-blur-xl transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_68%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
                  >
                    {content}
                  </a>
                )
              }

              return (
                <article
                  key={highlight.label}
                  className="rounded-[1.55rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-xl"
                >
                  {content}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="centro"
        className="scroll-mt-36 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] bg-[linear-gradient(180deg,rgba(247,245,241,0.96),rgba(240,236,230,0.75))]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{intro.eyebrow}</p>
            <h2 className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
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
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-soft)]">{intro.atmosphere.eyebrow}</p>
                <p className="mt-2 font-display text-3xl uppercase leading-none">{intro.atmosphere.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/74">{intro.atmosphere.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="metodo"
        className="scroll-mt-36 bg-[linear-gradient(180deg,rgba(183,206,231,0.16),rgba(247,245,241,0.92))]"
      >
        <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{method.eyebrow}</p>
            <h2 className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
              {method.title}
            </h2>
            <p className="mt-6 text-lg leading-9 text-muted-foreground">{method.description}</p>
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

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
            <div className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[var(--wellstudio-ink)] shadow-[0_24px_70px_rgba(17,19,22,0.12)]">
              <Image
                src={methodRopeImage}
                alt="Entrenamiento funcional intenso con cuerdas"
                className="aspect-[4/3.8] h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,19,22,0.08),rgba(17,19,22,0.55)_80%)]" />
            </div>

            <article className="rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-white px-6 py-6 shadow-[0_24px_70px_rgba(17,19,22,0.06)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{method.supportCard.eyebrow}</p>
              <h3 className="mt-3 text-balance font-display text-4xl uppercase leading-[0.96] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl">
                {method.supportCard.title}
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{method.supportCard.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {method.formats.map((format, index) => (
                  <div
                    key={format.label}
                    className={cn(
                      'rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] px-4 py-4',
                      index === 0
                        ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)]'
                        : index === 1
                          ? 'bg-[var(--wellstudio-blue-deep)] text-white'
                          : 'bg-[var(--wellstudio-ink)] text-white',
                    )}
                  >
                    <p className={cn('text-xs uppercase tracking-[0.18em]', index === 0 ? 'text-[var(--wellstudio-blue-deep)]' : 'text-white/58')}>
                      {format.label}
                    </p>
                    <p
                      className={cn(
                        'mt-3 font-display text-3xl uppercase leading-none',
                        index === 0 ? 'text-[var(--wellstudio-blue-deep)]' : 'text-[var(--wellstudio-blue-soft)]',
                      )}
                    >
                      {format.value}
                    </p>
                    <p className={cn('mt-3 text-sm leading-6', index === 0 ? 'text-muted-foreground' : 'text-white/72')}>
                      {format.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="testimonios" className="scroll-mt-36 bg-[var(--wellstudio-ink)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">{testimonials.eyebrow}</p>
            <h2 className="text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-white sm:text-6xl">
              {testimonials.title}
            </h2>
            <p className="text-lg leading-9 text-white/68">{testimonials.description}</p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.items.map((testimonial, index) => (
              <blockquote
                key={testimonial.author}
                className={cn(
                  'rounded-[2rem] border p-6 shadow-[0_18px_40px_rgba(5,7,9,0.16)]',
                  index === 1
                    ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_34%,transparent)] bg-[var(--wellstudio-blue-deep)]'
                    : 'border-white/10 bg-white/5',
                )}
              >
                <p className="font-display text-4xl leading-none text-[var(--wellstudio-blue-soft)]">“</p>
                <p className="mt-4 text-base leading-8 text-white/78">{testimonial.quote}</p>
                <footer className="mt-6 border-t border-white/10 pt-4 text-sm uppercase tracking-[0.18em] text-white/54">
                  {testimonial.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-36 bg-[linear-gradient(180deg,rgba(247,245,241,1),rgba(236,230,222,0.55))]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{faqSection.eyebrow}</p>
            <h2 className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
              {faqSection.title}
            </h2>
            <p className="mt-6 text-lg leading-9 text-muted-foreground">{faqSection.description}</p>

            <a
              href={contact.mapsHref}
              {...externalLocationLinkProps}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,var(--border))] bg-white px-4 py-3 text-sm font-medium text-[var(--wellstudio-blue-deep)] shadow-[0_12px_30px_rgba(17,19,22,0.05)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]/45"
            >
              Ver ubicación del centro
              <MoveUpRight
                aria-hidden="true"
                className="size-4"
              />
            </a>
          </div>
          <LandingFaqAccordion items={faq} />
        </div>
      </section>

      <section id="contacto" className="scroll-mt-36 bg-[var(--wellstudio-blue-deep)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">{contactSection.eyebrow}</p>
            <h2 className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-white sm:text-6xl">
              {contactSection.title}
            </h2>
            <p className="mt-6 text-lg leading-9 text-white/74">{contactSection.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${contact.email}`}
                className={cn(
                  solidButtonClass,
                  'border border-white/34 bg-white !text-[var(--wellstudio-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_36px_rgba(8,10,12,0.14)] hover:bg-[color:color-mix(in_srgb,white_92%,var(--wellstudio-blue-soft))] hover:!text-[var(--wellstudio-ink)] focus-visible:ring-white/55',
                )}
              >
                <Mail
                  aria-hidden="true"
                  className="size-4 text-[var(--wellstudio-blue-deep)]"
                />
                <span className="text-[var(--wellstudio-ink)]">Escribir por email</span>
              </a>
              <a
                href={contact.mapsHref}
                {...externalLocationLinkProps}
                className={cn(
                  outlineButtonClass,
                  'border-white/16 bg-white/8 text-white hover:bg-white/12 hover:text-white focus-visible:ring-white/45',
                )}
              >
                <MapPinned
                  aria-hidden="true"
                  className="size-4"
                />
                Abrir en Mapas
              </a>
              <a
                href={`tel:${contact.phone}`}
                className={cn(
                  outlineButtonClass,
                  'border-white/14 bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45',
                )}
              >
                <Phone
                  aria-hidden="true"
                  className="size-4"
                />
                Llamar al centro
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Phone
                  aria-hidden="true"
                  className="size-4 text-[var(--wellstudio-blue-soft)]"
                />
                <p className="text-xs uppercase tracking-[0.18em] text-white/58">Teléfono</p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="mt-3 block font-display text-3xl uppercase tracking-[0.03em] text-white"
              >
                {contact.phone}
              </a>
            </article>

            <article className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Mail
                  aria-hidden="true"
                  className="size-4 text-[var(--wellstudio-blue-soft)]"
                />
                <p className="text-xs uppercase tracking-[0.18em] text-white/58">Email</p>
              </div>
              <a
                href={`mailto:${contact.email}`}
                className="mt-3 block break-all text-base leading-8 text-white/80 transition-colors hover:text-white"
              >
                {contact.email}
              </a>
            </article>

            <a
              href={contact.mapsHref}
              {...externalLocationLinkProps}
              className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 text-left backdrop-blur-xl transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
            >
              <div className="flex items-center gap-3">
                <MapPinned
                  aria-hidden="true"
                  className="size-4 text-[var(--wellstudio-blue-soft)]"
                />
                <p className="text-xs uppercase tracking-[0.18em] text-white/58">Dirección</p>
              </div>
              <div className="mt-3 space-y-1 text-sm leading-7 text-white/76">
                {contact.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white">
                Abrir en Mapas
                <MoveUpRight
                  aria-hidden="true"
                  className="size-4"
                />
              </p>
            </a>

            <article className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Clock3
                  aria-hidden="true"
                  className="size-4 text-[var(--wellstudio-blue-soft)]"
                />
                <p className="text-xs uppercase tracking-[0.18em] text-white/58">Horario</p>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-7 text-white/76">
                {contact.hours.map((hour) => (
                  <p key={hour}>{hour}</p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgba(247,245,241,0.98),rgba(232,227,220,0.85))] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] bg-white/78 px-6 py-8 shadow-[0_24px_70px_rgba(17,19,22,0.06)] backdrop-blur-lg lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
          <div className="max-w-[22rem]">
            <WellstudioWordmark className="w-full max-w-[22rem]" />
          </div>

          <div className="mt-8 max-w-2xl lg:mt-0">
            <p className="text-balance font-display text-[2.5rem] uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl">
              Fuerza, criterio y seguimiento real
            </p>
            <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
              Un centro de entrenamiento con metodología propia, grupos reducidos y un planteamiento orientado a
              mejorar salud, rendimiento y composición corporal.
            </p>
          </div>
        </div>
      </section>

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
