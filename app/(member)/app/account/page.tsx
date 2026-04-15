import { Suspense } from 'react'

import { getMemberAccountOverview } from '@/modules/members/server/member-account-overview'
import { MemberAccountDashboard } from '@/modules/members/ui/member-account-dashboard'
import { MemberAccountSectionSkeleton } from '@/modules/members/ui/member-portal-section-skeleton'
import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'

export default function MemberAccountPage() {
  return (
    <MemberPortalSectionShell
      eyebrow="Cuenta"
      title="Cuenta y pagos"
      description="Cuenta reúne la capa comercial del portal: plan, créditos, tarjeta principal, pagos recientes y las señales operativas que hoy ya se pueden inferir sin inventar reglas nuevas."
    >
      <Suspense fallback={<MemberAccountSectionSkeleton />}>
        <MemberAccountSection />
      </Suspense>
    </MemberPortalSectionShell>
  )
}

async function MemberAccountSection() {
  const overview = await getMemberAccountOverview()

  return <MemberAccountDashboard overview={overview} />
}
