import { Clock3, Mail, MapPinned, MoveUpRight, Phone } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { LandingContact, LandingContent } from '@/modules/public/content/landing-content'
import {
  externalLocationLinkProps,
  outlineButtonClass,
  solidButtonClass,
} from '@/modules/public/ui/landing/landing-config'

type LandingContactSectionProps = {
  contactSection: LandingContent['contactSection']
  contact: LandingContact
}

export function LandingContactSection({
  contactSection,
  contact,
}: LandingContactSectionProps) {
  return (
    <section
      id="contacto"
      aria-labelledby="landing-contacto-heading"
      className="scroll-mt-36 bg-[var(--wellstudio-blue-deep)] text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
            {contactSection.eyebrow}
          </p>
          <h2
            id="landing-contacto-heading"
            className="mt-4 text-balance font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.03em] text-white sm:text-6xl"
          >
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
          <article
            aria-labelledby="landing-contact-details-heading"
            className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 backdrop-blur-xl"
          >
            <h3
              id="landing-contact-details-heading"
              className="sr-only"
            >
              Datos de contacto
            </h3>
            <address className="grid gap-5 not-italic">
              <div>
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
              </div>

              <div className="border-t border-white/10 pt-5">
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
              </div>
            </address>
          </article>

          <a
            href={contact.mapsHref}
            {...externalLocationLinkProps}
            aria-labelledby="landing-contact-location-heading landing-contact-location-action"
            className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 text-left backdrop-blur-xl transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
          >
            <div className="grid gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <MapPinned
                    aria-hidden="true"
                    className="size-4 text-[var(--wellstudio-blue-soft)]"
                  />
                  <p
                    id="landing-contact-location-heading"
                    className="text-xs uppercase tracking-[0.18em] text-white/58"
                  >
                    Dirección
                  </p>
                </div>
                <address className="mt-3 space-y-1 text-sm leading-7 text-white/76 not-italic">
                  {contact.addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </address>
                <p
                  id="landing-contact-location-action"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white"
                >
                  Abrir en Mapas
                  <MoveUpRight
                    aria-hidden="true"
                    className="size-4"
                  />
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <div className="flex items-center gap-3">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 text-[var(--wellstudio-blue-soft)]"
                  />
                  <p className="text-xs uppercase tracking-[0.18em] text-white/58">Horario</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-white/76">
                  {contact.hours.map((hour) => (
                    <li key={hour}>{hour}</li>
                  ))}
                </ul>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
