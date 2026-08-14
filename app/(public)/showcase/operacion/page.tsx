import type { Metadata } from 'next'

import { ShowcaseOperationDeck } from '@/modules/public/ui/showcase/showcase-operation-deck'

export const metadata: Metadata = {
  title: 'WellStudio — cómo trabajamos con tu centro',
  description:
    'Acuerdo claro para centros boutique: qué hace tu equipo, qué hacemos nosotros, cómo arrancamos y qué incluye la cuota — sin tecnicismos.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/showcase/operacion',
  },
}

export default function ShowcaseOperationPage() {
  return (
    <main id="main-content">
      <ShowcaseOperationDeck />
    </main>
  )
}
