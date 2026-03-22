export type LandingHero = {
  eyebrow: string
  title: string
  description: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  badge: string
  stats: Array<{
    label: string
    value: string
    description?: string
  }>
  panel: {
    eyebrow: string
    title: string
    description: string
    summary: string
  }
}

export type LandingHighlight = {
  label: string
  value: string
  description: string
}

export type LandingPillar = {
  title: string
  description: string
}

export type LandingTestimonial = {
  quote: string
  author: string
}

export type LandingFaq = {
  question: string
  answer: string
}

export type LandingContact = {
  phone: string
  email: string
  addressLines: string[]
  mapsHref: string
  hours: string[]
}

export type LandingContent = {
  hero: LandingHero
  intro: {
    eyebrow: string
    title: string
    description: string
    atmosphere: {
      eyebrow: string
      title: string
      description: string
    }
    values: Array<{
      title: string
      description: string
    }>
  }
  highlights: LandingHighlight[]
  method: {
    eyebrow: string
    title: string
    description: string
    supportCard: {
      eyebrow: string
      title: string
      description: string
    }
    formats: Array<{
      label: string
      value: string
      description: string
    }>
  }
  pillars: LandingPillar[]
  testimonials: {
    eyebrow: string
    title: string
    description: string
    items: LandingTestimonial[]
  }
  faqSection: {
    eyebrow: string
    title: string
    description: string
  }
  faq: LandingFaq[]
  contactSection: {
    eyebrow: string
    title: string
    description: string
  }
  contact: LandingContact
}

export const landingContent: LandingContent = {
  hero: {
    eyebrow: 'Entrenamiento de fuerza en Madrid',
    title: 'Entrenamiento de fuerza con grupos reducidos y metodología propia',
    description:
      'WellStudio es un centro boutique de entrenamiento con grupos premium de hasta 4 personas y grupos dinámicos de hasta 10, en un entorno cuidado y con seguimiento profesional durante la clase.',
    primaryCtaLabel: 'Quiero conocer el centro',
    primaryCtaHref: '#contacto',
    secondaryCtaLabel: 'Ver metodología',
    secondaryCtaHref: '#metodo',
    badge: 'Madrid · Grupos reducidos',
    stats: [
      {
        label: 'Grupo premium',
        value: '4 personas max.',
      },
      {
        label: 'Grupo dinámico',
        value: '10 personas max.',
      },
      {
        label: 'Ubicación',
        value: 'Tetuán, Madrid',
        description: 'Abrir dirección en mapas',
      },
    ],
    panel: {
      eyebrow: 'Qué ofrece WellStudio',
      title: 'Entrenamiento guiado con grupos reducidos',
      description:
        'Entrenamiento de fuerza con metodología propia, estructura clara y seguimiento profesional durante la sesión.',
      summary: 'Grupos premium 4 max. · Grupos dinámicos 10 max.',
    },
  },
  intro: {
    eyebrow: 'Conoce WellStudio',
    title: 'Un centro boutique de entrenamiento con criterio, estructura y seguimiento',
    description:
      'WellStudio es un centro boutique de entrenamiento donde la calidad del servicio, la metodología y el seguimiento marcan la diferencia. Trabajamos con un enfoque propio para ayudarte a mejorar salud, rendimiento y composición corporal de forma eficaz y sostenible.',
    atmosphere: {
      eyebrow: 'El centro',
      title: 'Un entorno cuidado para entrenar con atención y continuidad',
      description:
        'Sesiones estructuradas, grupos reducidos y un ambiente pensado para entrenar con comodidad, criterio y constancia.',
    },
    values: [
      {
        title: 'Metodología propia',
        description: 'Sesiones guiadas con estructura clara y objetivos bien definidos.',
      },
      {
        title: 'Seguimiento cercano',
        description: 'Grupos reducidos para poder corregir, acompañar y progresar con criterio.',
      },
      {
        title: 'Trabajo sostenible',
        description: 'Un planteamiento pensado para avanzar de forma constante y realista.',
      },
    ],
  },
  highlights: [
    {
      label: 'Grupos premium',
      value: '4 personas',
      description: 'Grupo reducido para trabajar con más seguimiento durante la sesión.',
    },
    {
      label: 'Grupos dinámicos',
      value: '10 personas',
      description: 'Clases grupales guiadas con estructura y ritmo de trabajo definido.',
    },
    {
      label: 'Horario continuo',
      value: 'mañana y tarde',
      description: 'Ventanas de entrenamiento que encajan con ritmos de trabajo reales.',
    },
    {
      label: 'Ubicación',
      value: 'Tetuán, Madrid',
      description: 'Centro boutique en Calle de Juan Pradillo, 2.',
    },
  ],
  method: {
    eyebrow: 'Método',
    title: 'Entrenamiento de fuerza con grupos reducidos',
    description:
      'La propuesta de WellStudio se apoya en una metodología propia, seguimiento profesional y dos formatos de clase: grupos premium de hasta 4 personas y grupos dinámicos de hasta 10.',
    supportCard: {
      eyebrow: 'Formato de trabajo',
      title: 'Dos formatos de clase, misma metodología',
      description:
        'Las sesiones están guiadas y estructuradas para trabajar fuerza con criterio, continuidad y supervisión durante la clase.',
    },
    formats: [
      {
        label: 'Entrenamiento de fuerza',
        value: 'Sesiones guiadas',
        description: 'Trabajo estructurado con atención técnica y objetivos claros en cada sesión.',
      },
      {
        label: 'Grupos premium',
        value: '4 personas max.',
        description: 'Formato reducido para un seguimiento más cercano durante la clase.',
      },
      {
        label: 'Grupos dinámicos',
        value: '10 personas max.',
        description: 'Clases grupales con energía de grupo y una estructura bien definida.',
      },
    ],
  },
  pillars: [
    {
      title: 'Metodología propia y planificación',
      description:
        'Cada sesión responde a una estructura de trabajo clara, con objetivos concretos y una progresión coherente.',
    },
    {
      title: 'Grupos reducidos y seguimiento',
      description:
        'El tamaño del grupo permite acompañamiento, corrección y atención durante la clase sin perder dinamismo.',
    },
    {
      title: 'Progreso eficaz y sostenible',
      description:
        'La propuesta busca mejorar salud, rendimiento y composición corporal desde la constancia y el criterio profesional.',
    },
  ],
  testimonials: {
    eyebrow: 'Testimonios',
    title: 'Opiniones de personas que entrenan en WellStudio',
    description: 'Experiencias reales sobre la planificación, el seguimiento y el ambiente de entrenamiento.',
    items: [
      {
        quote:
          'Destacaría la planificación de los entrenamientos. Nada es improvisado y el ambiente de entrenamiento es excepcional.',
        author: 'Ana Diego',
      },
      {
        quote:
          'Antes de empezar mis condiciones eran muy malas. En estos meses he ganado fuerza, equilibrio y he conseguido sacar lo mejor de mí.',
        author: 'Mari Carmen',
      },
      {
        quote:
          'Mi experiencia es fantástica. Me han ayudado a redescubrir el deporte y a recuperar motivación y fuerza de voluntad.',
        author: 'Cristóbal Marchal',
      },
    ],
  },
  faqSection: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Información práctica sobre WellStudio',
    description: 'Si tienes dudas sobre los formatos, el horario o la ubicación, aquí tienes la información esencial.',
  },
  faq: [
    {
      question: '¿Qué tipo de entrenamiento ofrece WellStudio?',
      answer:
        'WellStudio trabaja principalmente el entrenamiento de fuerza mediante sesiones guiadas en grupos reducidos.',
    },
    {
      question: '¿Cuál es la diferencia entre grupos premium y grupos dinámicos?',
      answer:
        'Los grupos premium están limitados a 4 personas y ofrecen un seguimiento más cercano durante la sesión. Los grupos dinámicos llegan hasta 10 personas y mantienen la misma metodología en un formato más amplio.',
    },
    {
      question: '¿Necesito experiencia previa para empezar?',
      answer:
        'No. Las clases están planteadas para adaptarse al punto de partida de cada persona, tanto si empieza como si ya entrena y quiere hacerlo con más estructura.',
    },
    {
      question: '¿Dónde está el centro y en qué horario trabaja?',
      answer:
        'WellStudio está en Calle de Juan Pradillo, 2, Tetuán, Madrid. El horario actual es de lunes a viernes de 07:15 a 15:00 y de 17:00 a 21:30. Sábados y domingos permanece cerrado.',
    },
  ],
  contactSection: {
    eyebrow: 'Contacto',
    title: 'Contacta con WellStudio',
    description: 'Si quieres ampliar información o conocer el centro, puedes escribirnos, llamarnos o venir al estudio.',
  },
  contact: {
    phone: '614882404',
    email: 'wellstudiofit@gmail.com',
    addressLines: ['Calle de Juan Pradillo, 2', '28039, Tetuán, Madrid'],
    mapsHref:
      'https://www.google.com/maps/search/?api=1&query=Calle+de+Juan+Pradillo+2%2C+28039+Madrid',
    hours: ['Lunes a viernes: 07:15 - 15:00 y 17:00 - 21:30', 'Sábado y domingo: cerrado'],
  },
}
