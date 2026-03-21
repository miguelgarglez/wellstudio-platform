import Link from 'next/link'
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

import { cn } from '@/lib/utils'
import { WellstudioLogoMark } from '@/components/brand/wellstudio-logo-mark'
import { landingContent } from '@/modules/public/content/landing-content'
import { LandingFaqAccordion } from '@/modules/public/ui/landing/landing-faq-accordion'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

const navigationLinks = [
  { href: '#centro', label: 'Centro' },
  { href: '#metodo', label: 'Método' },
  { href: '#testimonios', label: 'Testimonios' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contacto', label: 'Contacto' },
] as const

const highlightIcons = [Users, Dumbbell, Clock3, MapPinned]

const baseButtonClass =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 active:translate-y-px'

const solidButtonClass = `${baseButtonClass} h-12 rounded-full px-6 text-sm font-medium`

const outlineButtonClass =
  `${baseButtonClass} h-12 rounded-full border px-6 text-sm font-medium`

export function PublicLandingPage() {
  const { hero, intro, highlights, pillars, testimonials, faq, contact } = landingContent

  return (
    <main
      id="main-content"
      className="wellstudio-landing-shell min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      <div className="sticky top-3 z-40 px-4 pt-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-6 rounded-full border border-white/12 bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_84%,rgba(13,15,18,0.45))] px-4 py-3 text-white shadow-[0_24px_60px_rgba(8,10,12,0.22)] backdrop-blur-2xl sm:px-5">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <WellstudioLogoMark className="size-12 rounded-[1.1rem] shadow-none" />
              <div className="min-w-0">
                <p className="font-display text-2xl uppercase tracking-[0.08em] text-white">WellStudio</p>
                <p className="hidden truncate text-xs text-white/58 sm:block">
                  Fuerza, criterio y seguimiento real
                </p>
              </div>
            </Link>

            <nav
              aria-label="Navegación pública"
              className="hidden items-center gap-5 text-sm text-white/74 lg:flex"
            >
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <Link
              href="/login"
              className={cn(
                outlineButtonClass,
                'border-white/16 bg-white/6 px-4 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45',
              )}
            >
              Acceso socios
            </Link>
          </header>
        </div>
      </div>

      <section className="relative isolate -mt-20 overflow-hidden bg-[var(--wellstudio-ink)] pt-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,137,197,0.26),transparent_26%),radial-gradient(circle_at_78%_12%,rgba(183,206,231,0.12),transparent_22%),linear-gradient(180deg,rgba(15,16,18,0.98),rgba(15,16,18,0.92))]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(183,206,231,0.55),transparent)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-5 sm:px-6 md:pb-20 lg:px-8 lg:pb-24">
          <div className="grid gap-12 pt-14 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:items-end lg:pt-20">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">{hero.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-balance font-display text-6xl leading-[0.92] uppercase tracking-[0.03em] text-white sm:text-7xl lg:text-[6.4rem]">
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

            <div className="rounded-[2rem] border border-white/12 bg-white/7 p-5 shadow-[0_24px_80px_rgba(5,7,9,0.28)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
                    Qué encontrarás
                  </p>
                  <p className="mt-2 font-display text-3xl uppercase leading-none text-white">
                    Un estudio serio, no una sala masiva
                  </p>
                </div>
                <Sparkles
                  aria-hidden="true"
                  className="mt-1 size-5 text-[var(--wellstudio-blue-soft)]"
                />
              </div>

              <div className="grid gap-3 pt-5">
                <div className="rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/54">Atención</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    Seguimiento real, corrección técnica y un entorno cuidado para entrenar con foco.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/54">Formatos</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    Grupos premium de 4 personas y grupos dinámicos de hasta 10, según el nivel de acompañamiento que
                    buscas.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/54">Ubicación</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    Calle de Juan Pradillo, 2, Tetuán. Madrid.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {highlights.map((highlight, index) => {
              const Icon = highlightIcons[index]

              return (
                <article
                  key={highlight.label}
                  className="rounded-[1.55rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-xl"
                >
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
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="centro"
        className="scroll-mt-32 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] bg-[linear-gradient(180deg,rgba(247,245,241,0.96),rgba(240,236,230,0.75))]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{intro.eyebrow}</p>
            <h2 className="mt-4 text-balance font-display text-5xl uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
              {intro.title}
            </h2>
            <p className="mt-6 text-lg leading-9 text-[color:color-mix(in_srgb,var(--wellstudio-ink)_74%,white)]">
              {intro.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-white px-5 py-5 shadow-[0_18px_40px_rgba(17,19,22,0.05)]">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">Dirección</p>
                <p className="mt-3 text-lg font-medium text-[var(--wellstudio-ink)]">{contact.addressLines[0]}</p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{contact.addressLines[1]}</p>
              </div>
              <div className="rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[var(--wellstudio-blue-deep)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(47,75,103,0.18)]">
                <p className="text-xs uppercase tracking-[0.18em] text-white/58">Horarios</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-white/76">
                  {contact.hours.map((hour) => (
                    <p key={hour}>{hour}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_15%,var(--border))] bg-[var(--wellstudio-ink)] p-6 text-white shadow-[0_24px_80px_rgba(17,19,22,0.16)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">Cómo se siente</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="font-display text-3xl uppercase leading-none">Premium</p>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Sin tono elitista. Más bien serio, claro y cuidado en la ejecución.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="font-display text-3xl uppercase leading-none">Cercano</p>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  El seguimiento importa. El formato y el tamaño de grupo están diseñados para eso.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="font-display text-3xl uppercase leading-none">Sostenible</p>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  El objetivo no es agotarte un día, sino construir progreso que puedas mantener.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="metodo"
        className="scroll-mt-32 bg-[linear-gradient(180deg,rgba(183,206,231,0.16),rgba(247,245,241,0.92))]"
      >
        <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Método</p>
            <h2 className="mt-4 text-balance font-display text-5xl uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
              Entrenar mejor empieza por tener menos ruido
            </h2>
            <p className="mt-6 text-lg leading-9 text-muted-foreground">
              La propuesta de WellStudio busca quitar fricción y devolver claridad: qué entrenas, con qué objetivo, en
              qué formato y con qué nivel de seguimiento.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className={cn(
                  'group relative overflow-hidden rounded-[2rem] border px-6 py-6 shadow-[0_20px_50px_rgba(17,19,22,0.07)] transition-transform duration-300 hover:-translate-y-1',
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
        </div>
      </section>

      <section id="testimonios" className="scroll-mt-32 bg-[var(--wellstudio-ink)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">Testimonios</p>
            <h2 className="text-balance font-display text-5xl uppercase leading-[0.94] tracking-[0.03em] text-white sm:text-6xl">
              Historias reales, no promesas infladas
            </h2>
            <p className="text-lg leading-9 text-white/68">
              El valor de un centro así se nota en la continuidad, en la confianza y en cómo cambia la relación con el
              entrenamiento a medio plazo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
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
        className="scroll-mt-32 bg-[linear-gradient(180deg,rgba(247,245,241,1),rgba(236,230,222,0.55))]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Preguntas frecuentes</p>
            <h2 className="mt-4 text-balance font-display text-5xl uppercase leading-[0.94] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-6xl">
              La información importante, sin rodeos
            </h2>
            <p className="mt-6 text-lg leading-9 text-muted-foreground">
              Esta primera versión de la landing está pensada para explicar bien la propuesta de valor y facilitar el
              primer contacto. La agenda pública llegará después en una superficie propia.
            </p>
          </div>
          <LandingFaqAccordion items={faq} />
        </div>
      </section>

      <section id="contacto" className="scroll-mt-32 bg-[var(--wellstudio-blue-deep)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">Contacto</p>
            <h2 className="mt-4 text-balance font-display text-5xl uppercase leading-[0.94] tracking-[0.03em] text-white sm:text-6xl">
              Si quieres saber si WellStudio encaja contigo, este es el siguiente paso
            </h2>
            <p className="mt-6 text-lg leading-9 text-white/74">
              Escríbenos, llámanos o pásate por el centro. La siguiente iteración incorporará el formulario de captación
              dentro de la propia landing; de momento dejamos ya resuelto el bloque comercial y el CTA principal.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${contact.email}`}
                className={cn(
                  solidButtonClass,
                  'border border-white/16 bg-[var(--wellstudio-blue-soft)] text-[var(--wellstudio-ink)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue-soft)_88%,white)] hover:text-[var(--wellstudio-ink)] focus-visible:ring-white/55',
                )}
              >
                Escribir por email
                <MoveUpRight
                  aria-hidden="true"
                  className="size-4"
                />
              </a>
              <a
                href={`tel:${contact.phone}`}
                className={cn(
                  outlineButtonClass,
                  'border-white/14 bg-white/6 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45',
                )}
              >
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

            <article className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 backdrop-blur-xl">
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
            </article>

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
