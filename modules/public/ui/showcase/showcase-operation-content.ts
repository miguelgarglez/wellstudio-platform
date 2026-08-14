import type { DeckSlide } from '@/modules/public/ui/showcase/showcase-deck-types'

export type OperationVisualLayout =
  | 'pain-stack'
  | 'models-table'
  | 'ownership-matrix'
  | 'phases-timeline'
  | 'support-split'
  | 'variants-cards'

export type OperationSlide = DeckSlide & {
  visual?: OperationVisualLayout
}

export const operationSlides: OperationSlide[] = [
  {
    id: 'hero',
    eyebrow: 'Cómo trabajamos',
    title: 'Tú gestionas el centro; nosotros el software',
    body: 'WellStudio no es solo una app: es un acuerdo claro. Tu equipo usa el mostrador digital cada día; nosotros nos encargamos de que la web, los accesos y los cobros online funcionen sin que tengáis que ser expertos en informática.',
    kind: 'hero',
  },
  {
    id: 'problem',
    eyebrow: 'El problema habitual',
    title: 'Reservar y cobrar online no debería ser un segundo trabajo',
    body: 'Muchos centros acaban con la web por un lado, WhatsApp por otro, Excel en medio y un proveedor de pagos que nadie del equipo entiende del todo. El tiempo se va en coordinar piezas, no en atender socios.',
    kind: 'copy',
    bullets: [
      'Varias herramientas que no hablan entre sí',
      'Dudas de quién arregla qué cuando algo falla',
      'Miedo a tocar algo y “romper” la web o los cobros',
    ],
    visual: 'pain-stack',
  },
  {
    id: 'models',
    eyebrow: 'Formas de colaborar',
    title: 'Tres opciones — una que encaja con la mayoría',
    body: 'La mayoría de boutiques eligen el modelo híbrido: vosotros lleváis el negocio con total claridad; nosotros la parte técnica entre bastidores. Las otras dos existen si preferís más (o menos) autonomía.',
    kind: 'copy',
    visual: 'models-table',
  },
  {
    id: 'ownership',
    eyebrow: 'Modelo híbrido',
    title: 'Quién hace qué, sin líos',
    body: 'Vuestra marca y vuestra cuenta de cobros, preferiblemente a vuestro nombre. Nosotros conectamos todo, actualizamos el sistema y resolvemos lo técnico. Vosotros publicáis la agenda, atendéis socios y consultáis lo que ha entrado.',
    kind: 'copy',
    visual: 'ownership-matrix',
  },
  {
    id: 'phases',
    eyebrow: 'Cómo arrancamos',
    title: 'Paso a paso, sin prisas el primer día',
    body: 'No activamos cobros reales el lunes de la semana uno. Primero probamos la operativa del mostrador con vuestro equipo y unos socios de confianza. Cuando todo encaja, abrimos los pagos online con el mismo grupo.',
    kind: 'copy',
    visual: 'phases-timeline',
  },
  {
    id: 'support',
    eyebrow: 'Soporte y cuota',
    title: 'Qué incluye la cuota y qué va aparte',
    body: 'La cuota mensual cubre que el sistema esté vivo, seguro y arreglado cuando algo falla. Si queréis una función nueva, un informe especial o un cambio grande de diseño, lo hablamos antes y se presupuesta aparte.',
    kind: 'copy',
    bullets: [
      'Un canal de contacto acordado (email o WhatsApp)',
      'Formación del equipo: sesión de 45–60 min + guía de una página',
      'Actualizaciones y mejoras de mantenimiento incluidas',
    ],
    visual: 'support-split',
  },
  {
    id: 'variants',
    eyebrow: 'Otras opciones',
    title: 'Si preferís otro nivel de implicación',
    body: 'No hace falta un manual distinto para cada caso: el producto es el mismo. Solo cambia quién se encarga de la parte técnica a largo plazo.',
    kind: 'copy',
    visual: 'variants-cards',
  },
  {
    id: 'cta',
    eyebrow: 'Siguiente paso',
    title: 'Mirad el producto y probadlo en vivo',
    body: 'En el showcase veréis capturas reales de la web, el área de socio y el mostrador del centro. Si os encaja, recogemos vuestros datos y fijamos calendario de arranque.',
    kind: 'cta',
  },
]
