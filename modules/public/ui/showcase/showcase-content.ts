export type ShowcaseSlideId =
  | 'hero'
  | 'pain'
  | 'promise'
  | 'public'
  | 'member'
  | 'staff'
  | 'payments'
  | 'outcome'
  | 'cta'

export type ShowcaseSlide = {
  id: ShowcaseSlideId
  eyebrow: string
  title: string
  body: string
  kind: 'hero' | 'copy' | 'journey' | 'outcome' | 'cta'
  bullets?: string[]
  frame?: 'public' | 'member' | 'staff' | 'payments'
  demoPlaceholder?: string
}

export const SHOWCASE_PREVIEW_URL = 'https://preview-wellstudio.miguelgarglez.com'
export const SHOWCASE_CONTACT_MAIL = 'mailto:miguel.garglez@gmail.com'

export const showcaseSlides: ShowcaseSlide[] = [
  {
    id: 'hero',
    eyebrow: 'WellStudio Platform',
    title: 'Reservas, mostrador y cobros en un solo producto',
    body: 'Software para centros boutique: socios reservan, el staff opera el día a día y los bonos se cobran online — sin ensamblar widgets.',
    kind: 'hero',
  },
  {
    id: 'pain',
    eyebrow: 'El problema',
    title: 'Operar con piezas sueltas cansa al centro',
    body: 'Web de marketing por un lado, reservas por otro, cobros a mano y leads que se pierden. El equipo acaba parcheando en vez de atender.',
    kind: 'copy',
    bullets: [
      'Socios y staff en herramientas distintas',
      'Agenda pública que no habla con el mostrador',
      'Cobros y créditos fuera del flujo de reserva',
    ],
  },
  {
    id: 'promise',
    eyebrow: 'La promesa',
    title: 'Un portal coherente para quien entrena y quien opera',
    body: 'Web pública, área de socio y backoffice del centro sobre el mismo dominio y las mismas reglas de aforo y elegibilidad.',
    kind: 'copy',
    bullets: [
      'Público: agenda, planes y captación',
      'Socio: reservar, cancelar, cuenta y bonos',
      'Staff: sesiones, fichas y reservas asistidas',
    ],
  },
  {
    id: 'public',
    eyebrow: 'Journey 1 · Público',
    title: 'La agenda convence antes del registro',
    body: 'Visitantes ven horarios reales, disponibilidad y dejan su teléfono. El centro responde desde el mismo producto.',
    kind: 'journey',
    frame: 'public',
    demoPlaceholder: 'Clip ≤45s · agenda → lead',
  },
  {
    id: 'member',
    eyebrow: 'Journey 2 · Socio',
    title: 'Reservar y cancelar sin fricción',
    body: 'El socio entra, ve su cobertura y gestiona plazas con reglas claras. La cuenta muestra saldo, bonos y tarjeta con confianza.',
    kind: 'journey',
    frame: 'member',
    demoPlaceholder: 'Clip ≤45s · login → reserva',
  },
  {
    id: 'staff',
    eyebrow: 'Journey 3 · Staff',
    title: 'El mostrador controla el día',
    body: 'Overview operativo, sesiones, ficha del socio y reserva asistida con las mismas reglas — sin saltarse aforo a escondidas.',
    kind: 'journey',
    frame: 'staff',
    demoPlaceholder: 'Clip ≤45s · overview → asistida',
  },
  {
    id: 'payments',
    eyebrow: 'Cobros',
    title: 'Bonos online que activan créditos al momento',
    body: 'Checkout Stripe alojado: el centro no toca tarjetas. Al confirmarse el pago, el socio ya puede reservar.',
    kind: 'journey',
    frame: 'payments',
  },
  {
    id: 'outcome',
    eyebrow: 'Resultado',
    title: 'Lo que el centro puede hacer sin ti en la sala',
    body: 'Operativa cerrada y vendible: agenda viva, altas con cobertura, reservas reales y un camino claro al cobro online.',
    kind: 'outcome',
    bullets: [
      'Publicar la semana y ver ocupación',
      'Dar de alta y asignar plan o bono',
      'Que el socio reserve y cancele solo',
      'Cobrar un bono online o en mostrador',
      'Recibir un lead y responder',
    ],
  },
  {
    id: 'cta',
    eyebrow: 'Siguiente paso',
    title: 'Míralo en vivo o hablemos',
    body: 'El showcase es la historia. Preview es el producto real. Si encaja con tu centro, lo afinamos juntos.',
    kind: 'cta',
  },
]
