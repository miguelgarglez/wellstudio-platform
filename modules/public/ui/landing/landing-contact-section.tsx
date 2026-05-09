import { Clock3, Mail, MapPinned, MoveUpRight, Phone } from 'lucide-react'

import type { LandingContact, LandingContent } from '@/modules/public/content/landing-content'
import type { LandingLeadAttribution } from '@/modules/public/ui/landing/public-landing-page'
import { PublicLeadForm } from '@/modules/public/ui/landing/public-lead-form'
import { externalLocationLinkProps } from '@/modules/public/ui/landing/landing-config'

type LandingContactSectionProps = {
  contactSection: LandingContent['contactSection']
  contact: LandingContact
  leadAttribution?: LandingLeadAttribution
}

export function LandingContactSection({
  contactSection,
  contact,
  leadAttribution,
}: LandingContactSectionProps) {
  return (
    <section
      id="contacto"
      aria-labelledby="landing-contacto-heading"
      className="scroll-mt-52 bg-[var(--wellstudio-blue-deep)] text-white sm:scroll-mt-36"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(24rem,0.72fr)] md:items-start lg:grid-cols-[minmax(0,0.92fr)_minmax(27rem,0.58fr)] lg:px-8 lg:py-24">
        <div className="max-w-3xl md:sticky md:top-32">
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

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/6 p-5 text-sm leading-7 text-white/72 backdrop-blur-xl">
            <p className="font-medium text-white">Si ya eres socio, entra al portal.</p>
            <p className="mt-1">
              Si quieres conocer el centro o resolver dudas antes de empezar, deja tu teléfono y
              te contactamos.
            </p>
          </div>
        </div>

        <div className="grid w-full max-w-[34rem] justify-self-center gap-4 md:justify-self-end lg:gap-5">
          <PublicLeadForm leadAttribution={leadAttribution} />

          <article
            aria-labelledby="landing-contact-details-heading"
            className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 backdrop-blur-xl"
          >
            <h3
              id="landing-contact-details-heading"
              className="text-xs uppercase tracking-[0.2em] text-white/58"
            >
              Otras vías de contacto
            </h3>
            <address className="mt-4 grid gap-3 not-italic sm:grid-cols-2">
              <a
                href={`tel:${contact.phone}`}
                className="group rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-4 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-center gap-3">
                  <Phone
                    aria-hidden="true"
                    className="size-4 text-[var(--wellstudio-blue-soft)]"
                  />
                  <p className="text-xs uppercase tracking-[0.18em] text-white/58">Teléfono</p>
                </div>
                <p className="mt-3 font-display text-2xl uppercase tracking-[0.03em] text-white">
                  {contact.phone}
                </p>
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="group rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-4 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-center gap-3">
                  <Mail
                    aria-hidden="true"
                    className="size-4 text-[var(--wellstudio-blue-soft)]"
                  />
                  <p className="text-xs uppercase tracking-[0.18em] text-white/58">Email</p>
                </div>
                <p className="mt-3 break-all text-sm leading-7 text-white/82">
                  {contact.email}
                </p>
              </a>
            </address>
          </article>

          <a
            href={contact.mapsHref}
            {...externalLocationLinkProps}
            aria-labelledby="landing-contact-location-heading landing-contact-location-action"
            className="rounded-[1.75rem] border border-white/12 bg-white/7 p-5 text-left backdrop-blur-xl transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
