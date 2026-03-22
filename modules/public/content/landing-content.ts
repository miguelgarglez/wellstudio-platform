export type LandingHero = {
  eyebrow: string
  title: string
  description: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
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
  }
  highlights: LandingHighlight[]
  pillars: LandingPillar[]
  testimonials: LandingTestimonial[]
  faq: LandingFaq[]
  contact: LandingContact
}

export const landingContent: LandingContent = {
  hero: {
    eyebrow: 'Entrenamiento boutique en Madrid',
    title: 'Fuerza, seguimiento y grupos reducidos para entrenar con criterio',
    description:
      'WellStudio combina atención personalizada, metodología propia y un entorno cuidado para ayudarte a mejorar salud, rendimiento y composición corporal sin perder claridad por el camino.',
    primaryCtaLabel: 'Quiero conocer el centro',
    primaryCtaHref: '#contacto',
    secondaryCtaLabel: 'Ver metodología',
    secondaryCtaHref: '#metodo',
  },
  intro: {
    eyebrow: 'Conoce WellStudio',
    title: 'Un centro pensado para quien busca calidad, estructura y trato cercano',
    description:
      'La propuesta de WellStudio no gira alrededor de clases masivas ni de una experiencia genérica de gimnasio. Aquí el foco está en entrenar mejor: con corrección técnica, planificación real y formatos reducidos que permiten acompañamiento continuo.',
  },
  highlights: [
    {
      label: 'Grupos premium',
      value: '4 personas',
      description: 'Formato de máxima atención para corrección, seguimiento y trabajo fino.',
    },
    {
      label: 'Grupos dinámicos',
      value: '10 personas',
      description: 'Entrenamientos guiados con energía de grupo y una estructura clara.',
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
  pillars: [
    {
      title: 'Evaluación y contexto antes de cargar',
      description:
        'No se trata de hacer más por hacer. El entrenamiento parte de tu punto real, tus objetivos y tu margen de mejora actual.',
    },
    {
      title: 'Grupos reducidos con corrección real',
      description:
        'El tamaño del grupo está al servicio de la calidad. Se busca atención suficiente para corregir, progresar y sostener la técnica.',
    },
    {
      title: 'Resultados sostenibles, no estímulo vacío',
      description:
        'La metodología prioriza consistencia, progreso medible y una experiencia que puedas mantener en el tiempo.',
    },
  ],
  testimonials: [
    {
      quote:
        'Destacaría la planificación de los entrenamientos, nada es improvisado y el ambiente de entrenamiento es excepcional.',
      author: 'Ana Diego',
    },
    {
      quote:
        'Mi experiencia es fantástica. Me han ayudado a redescubrir el deporte y a recuperar motivación, fuerza y voluntad.',
      author: 'Cristóbal Marchal',
    },
    {
      quote:
        'Antes de empezar estaba muy mal. En estos meses he ganado fuerza, equilibrio y he conseguido sacar lo mejor de mí.',
      author: 'Mari Carmen',
    },
  ],
  faq: [
    {
      question: '¿Qué tipo de entrenamiento ofrece WellStudio?',
      answer:
        'WellStudio trabaja con entrenamiento de fuerza y formatos guiados donde prima la atención personalizada, la técnica y el progreso estructurado.',
    },
    {
      question: '¿Cuál es la diferencia entre grupos premium y grupos dinámicos?',
      answer:
        'Los grupos premium están limitados a 4 personas para maximizar seguimiento y corrección. Los grupos dinámicos llegan hasta 10 personas y mantienen una experiencia guiada en formato más grupal.',
    },
    {
      question: '¿Necesito experiencia previa para empezar?',
      answer:
        'No. El centro está pensado para adaptar el entrenamiento al punto de partida de cada persona, tanto si empieza de cero como si ya entrena y quiere hacerlo mejor.',
    },
    {
      question: '¿Dónde está el centro y en qué horario trabaja?',
      answer:
        'WellStudio está en Calle de Juan Pradillo, 2, Tetuán, Madrid. El horario actual es de lunes a viernes de 07:15 a 15:00 y de 17:00 a 21:30. Sábados y domingos permanece cerrado.',
    },
  ],
  contact: {
    phone: '614882404',
    email: 'wellstudiofit@gmail.com',
    addressLines: ['Calle de Juan Pradillo, 2', '28039, Tetuán, Madrid'],
    mapsHref:
      'https://www.google.com/maps/search/?api=1&query=Calle+de+Juan+Pradillo+2%2C+28039+Madrid',
    hours: ['Lunes a viernes: 07:15 - 15:00 y 17:00 - 21:30', 'Sábado y domingo: cerrado'],
  },
}
