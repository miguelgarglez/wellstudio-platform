import type { Metadata } from 'next'

import { ShowcaseDeck } from '@/modules/public/ui/showcase/showcase-deck'

export const metadata: Metadata = {
  title: 'WellStudio Platform — demo comercial',
  description:
    'Showcase comercial de WellStudio Platform: reservas, mostrador y cobros en un solo producto para centros boutique.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/showcase',
  },
}

export default function ShowcasePage() {
  return (
    <main id="main-content">
      <ShowcaseDeck />
    </main>
  )
}
