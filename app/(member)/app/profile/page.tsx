import { Suspense } from 'react'

import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'
import { MemberProfileDashboard } from '@/modules/members/ui/member-profile-dashboard'
import { MemberProfileSectionSkeleton } from '@/modules/members/ui/member-portal-section-skeleton'
import { getMemberProfileOverview } from '@/modules/members/server/member-profile-overview'

export default function MemberProfilePage() {
  return (
    <MemberPortalSectionShell
      eyebrow="Perfil"
      title="Tus datos"
      description="Perfil concentra la información personal base del socio para que puedas revisar tu identidad, tu estado y los consentimientos ya registrados sin mezclarlo con reservas ni con la capa comercial."
    >
      <Suspense fallback={<MemberProfileSectionSkeleton />}>
        <MemberProfileSection />
      </Suspense>
    </MemberPortalSectionShell>
  )
}

async function MemberProfileSection() {
  const overview = await getMemberProfileOverview()

  return <MemberProfileDashboard overview={overview} />
}
