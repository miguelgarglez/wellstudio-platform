import type { StaticImageData } from 'next/image'

import memberAccountFull from '@/modules/public/ui/showcase/assets/member-account.webp'
import memberAccountThumb from '@/modules/public/ui/showcase/assets/member-account-thumb.webp'
import memberHomeFull from '@/modules/public/ui/showcase/assets/member-home.webp'
import memberHomeThumb from '@/modules/public/ui/showcase/assets/member-home-thumb.webp'
import memberReservationsFull from '@/modules/public/ui/showcase/assets/member-reservations.webp'
import memberReservationsThumb from '@/modules/public/ui/showcase/assets/member-reservations-thumb.webp'
import publicClassesFull from '@/modules/public/ui/showcase/assets/public-classes.webp'
import publicClassesThumb from '@/modules/public/ui/showcase/assets/public-classes-thumb.webp'
import publicHomeFull from '@/modules/public/ui/showcase/assets/public-home.webp'
import publicHomeThumb from '@/modules/public/ui/showcase/assets/public-home-thumb.webp'
import publicLeadFull from '@/modules/public/ui/showcase/assets/public-lead.webp'
import publicLeadThumb from '@/modules/public/ui/showcase/assets/public-lead-thumb.webp'
import publicPlansFull from '@/modules/public/ui/showcase/assets/public-plans.webp'
import publicPlansThumb from '@/modules/public/ui/showcase/assets/public-plans-thumb.webp'
import staffMembersFull from '@/modules/public/ui/showcase/assets/staff-members.webp'
import staffMembersThumb from '@/modules/public/ui/showcase/assets/staff-members-thumb.webp'
import staffOverviewFull from '@/modules/public/ui/showcase/assets/staff-overview.webp'
import staffOverviewThumb from '@/modules/public/ui/showcase/assets/staff-overview-thumb.webp'
import staffPaymentsFull from '@/modules/public/ui/showcase/assets/staff-payments.webp'
import staffPaymentsThumb from '@/modules/public/ui/showcase/assets/staff-payments-thumb.webp'
import staffSessionsFull from '@/modules/public/ui/showcase/assets/staff-sessions.webp'
import staffSessionsThumb from '@/modules/public/ui/showcase/assets/staff-sessions-thumb.webp'

export type ShowcaseShotKey =
  | 'public-home'
  | 'public-classes'
  | 'public-plans'
  | 'public-lead'
  | 'member-home'
  | 'member-reservations'
  | 'member-account'
  | 'staff-overview'
  | 'staff-sessions'
  | 'staff-members'
  | 'staff-payments'

export type ShowcaseJourneyTag = 'publico' | 'socio' | 'staff'

type ShowcaseShot = {
  thumbSrc: StaticImageData
  fullSrc: StaticImageData
  alt: string
  label: string
  journey: ShowcaseJourneyTag
  captionTitle: string
  caption: string
}

/** Logical gallery order: público → socio → staff. */
export const SHOWCASE_GALLERY_ORDER = [
  'public-home',
  'public-classes',
  'public-plans',
  'public-lead',
  'member-home',
  'member-reservations',
  'member-account',
  'staff-overview',
  'staff-sessions',
  'staff-members',
  'staff-payments',
] as const satisfies readonly ShowcaseShotKey[]

export const SHOWCASE_SHOTS: Record<ShowcaseShotKey, ShowcaseShot> = {
  'public-home': {
    thumbSrc: publicHomeThumb,
    fullSrc: publicHomeFull,
    alt: 'Landing pública de WellStudio con propuesta del centro',
    label: 'wellstudio · inicio',
    journey: 'publico',
    captionTitle: 'Landing del centro',
    caption:
      'La web pública transmite la propuesta del centro y lleva a agenda, planes y contacto sin salir de la marca.',
  },
  'public-classes': {
    thumbSrc: publicClassesThumb,
    fullSrc: publicClassesFull,
    alt: 'Agenda pública de WellStudio con clases y disponibilidad',
    label: 'wellstudio · agenda',
    journey: 'publico',
    captionTitle: 'Agenda pública en vivo',
    caption:
      'Horarios reales y plazas visibles antes del registro. El visitante decide con información, no con promesas.',
  },
  'public-plans': {
    thumbSrc: publicPlansThumb,
    fullSrc: publicPlansFull,
    alt: 'Planes y bonos publicados en la web del centro',
    label: 'wellstudio · planes',
    journey: 'publico',
    captionTitle: 'Planes y bonos publicados',
    caption:
      'Precios y coberturas claras en la web. El centro vende bonos online y activa créditos al confirmarse el pago.',
  },
  'public-lead': {
    thumbSrc: publicLeadThumb,
    fullSrc: publicLeadFull,
    alt: 'Formulario de captación de leads en la web pública',
    label: 'wellstudio · contacto',
    journey: 'publico',
    captionTitle: 'Captación de leads',
    caption:
      'Formulario integrado en la misma web. Cada solicitud llega al backoffice para que el equipo responda desde el producto.',
  },
  'member-home': {
    thumbSrc: memberHomeThumb,
    fullSrc: memberHomeFull,
    alt: 'Portal de socio WellStudio con inicio y cobertura',
    label: 'app · socio',
    journey: 'socio',
    captionTitle: 'Portal del socio',
    caption:
      'Inicio personalizado con cobertura, próximas reservas y accesos rápidos. El socio entra y sabe qué puede hacer.',
  },
  'member-reservations': {
    thumbSrc: memberReservationsThumb,
    fullSrc: memberReservationsFull,
    alt: 'Reservas del socio con plazas y cancelaciones',
    label: 'app · reservas',
    journey: 'socio',
    captionTitle: 'Reservas del socio',
    caption:
      'Reservar y cancelar con reglas claras de aforo y plazo. Sin llamadas al mostrador para gestionar la plaza.',
  },
  'member-account': {
    thumbSrc: memberAccountThumb,
    fullSrc: memberAccountFull,
    alt: 'Cuenta del socio con bonos, créditos y tarjeta',
    label: 'app · cuenta',
    journey: 'socio',
    captionTitle: 'Cuenta y bonos',
    caption:
      'Saldo, bonos activos y tarjeta en un solo lugar. Transparencia que reduce dudas en recepción.',
  },
  'staff-overview': {
    thumbSrc: staffOverviewThumb,
    fullSrc: staffOverviewFull,
    alt: 'Backoffice WellStudio con resumen operativo del día',
    label: 'admin · hoy',
    journey: 'staff',
    captionTitle: 'Control del día',
    caption:
      'Resumen operativo: sesiones, ocupación y alertas. El staff arranca la jornada con contexto, no con hojas sueltas.',
  },
  'staff-sessions': {
    thumbSrc: staffSessionsThumb,
    fullSrc: staffSessionsFull,
    alt: 'Agenda de sesiones del staff con aforo y reservas',
    label: 'admin · sesiones',
    journey: 'staff',
    captionTitle: 'Agenda de sesiones',
    caption:
      'Aforo, reservas y cancelaciones en tiempo real. El mostrador ve la misma verdad que el socio en la app.',
  },
  'staff-members': {
    thumbSrc: staffMembersThumb,
    fullSrc: staffMembersFull,
    alt: 'Gestión de socios en el backoffice del centro',
    label: 'admin · socios',
    journey: 'staff',
    captionTitle: 'Gestión de socios',
    caption:
      'Ficha completa, plan, créditos y reserva asistida. Todo el ciclo del socio desde el backoffice.',
  },
  'staff-payments': {
    thumbSrc: staffPaymentsThumb,
    fullSrc: staffPaymentsFull,
    alt: 'Cobros y bonos online en el panel de administración',
    label: 'admin · cobros',
    journey: 'staff',
    captionTitle: 'Cobros y bonos online',
    caption:
      'Checkout Stripe alojado: el centro no toca tarjetas. Al confirmarse el pago, los créditos quedan listos para reservar.',
  },
}

export type ShowcaseVisualLayout =
  | 'single'
  | 'duo'
  | 'trio'
  | 'quad'
  | 'hero-stack'
  | 'strip'
  | 'mosaic'

export type ShowcaseVisualSpec = {
  layout: ShowcaseVisualLayout
  shots: ShowcaseShotKey[]
  primary?: ShowcaseShotKey
  chrome?: boolean
  priority?: boolean
}

export function getShowcaseShot(key: ShowcaseShotKey): ShowcaseShot {
  return SHOWCASE_SHOTS[key]
}
