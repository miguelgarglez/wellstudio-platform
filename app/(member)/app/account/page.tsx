import { Suspense } from 'react'

import { getMemberAccountOverview } from '@/modules/members/server/member-account-overview'
import { MemberAccountDashboard } from '@/modules/members/ui/member-account-dashboard'
import { MemberAccountSectionSkeleton } from '@/modules/members/ui/member-portal-section-skeleton'
import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'

export default async function MemberAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string; checkout?: string; payment?: string }>
}) {
  const params = await searchParams
  return (
    <MemberPortalSectionShell
      eyebrow="Cuenta"
      title="Cuenta y pagos"
      description="Cuenta reúne la capa comercial del portal: plan, créditos, tarjeta principal, pagos recientes y las señales operativas que hoy ya se pueden inferir sin inventar reglas nuevas."
    >
      <Suspense fallback={<MemberAccountSectionSkeleton />}>
        <MemberAccountSection params={params} />
      </Suspense>
    </MemberPortalSectionShell>
  )
}

async function MemberAccountSection({ params }: {
  params: { pack?: string; checkout?: string; payment?: string }
}) {
  const overview = await getMemberAccountOverview({
    selectedPackSlug: params.pack,
    checkout: params.checkout,
    paymentId: params.payment,
  })

  return <MemberAccountDashboard overview={overview} />
}
