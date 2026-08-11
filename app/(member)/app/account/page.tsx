import { Suspense } from 'react'

import { getMemberAccountOverview } from '@/modules/members/server/member-account-overview'
import { MemberAccountDashboard } from '@/modules/members/ui/member-account-dashboard'
import { MemberAccountSectionSkeleton } from '@/modules/members/ui/member-portal-section-skeleton'
import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'

export default async function MemberAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string; checkout?: string; card?: string; payment?: string }>
}) {
  const params = await searchParams
  return (
    <MemberPortalSectionShell
      eyebrow="Cuenta"
      title="Cuenta y pagos"
      description="Aquí gestionas tu plan, bonos, tarjeta y pagos recientes."
    >
      <Suspense fallback={<MemberAccountSectionSkeleton />}>
        <MemberAccountSection params={params} />
      </Suspense>
    </MemberPortalSectionShell>
  )
}

async function MemberAccountSection({ params }: {
  params: { pack?: string; checkout?: string; card?: string; payment?: string }
}) {
  const overview = await getMemberAccountOverview({
    selectedPackSlug: params.pack,
    checkout: params.checkout,
    card: params.card,
    paymentId: params.payment,
  })

  return <MemberAccountDashboard overview={overview} />
}
