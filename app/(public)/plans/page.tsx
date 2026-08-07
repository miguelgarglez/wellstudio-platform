import type { Metadata } from 'next'
import { Suspense } from 'react'

import { getPublicProductCatalog } from '@/modules/public/server/public-product-catalog'
import { PublicPlansPage } from '@/modules/public/ui/plans/public-plans-page'
import { PublicPlansSkeleton } from '@/modules/public/ui/plans/public-plans-skeleton'

const title = 'Planes y bonos | WellStudio Madrid'
const description = 'Compara los planes y bonos activos de WellStudio, su precio, frecuencia de reserva y vigencia antes de empezar.'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/plans' },
  openGraph: {
    title,
    description,
    url: '/plans',
    siteName: 'WellStudio',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function PlansPage() {
  return (
    <Suspense fallback={<PublicPlansSkeleton />}>
      <PlansContent />
    </Suspense>
  )
}

async function PlansContent() {
  const catalog = await getPublicProductCatalog()
  return <PublicPlansPage catalog={catalog} />
}
