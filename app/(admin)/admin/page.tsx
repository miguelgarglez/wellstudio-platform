import { Suspense } from 'react'

import { getAdminMembershipPolicyOverview } from '@/modules/admin/server/admin-membership-policy-overview'
import {
  AdminMembershipPoliciesDashboard,
  AdminMembershipPoliciesDashboardSkeleton,
} from '@/modules/admin/ui/admin-membership-policies-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

type AdminPageProps = {
  searchParams?: Promise<{
    plan?: string
    updated?: string
  }>
}

export default async function AdminHomePage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const selectedPlanId =
    typeof resolvedSearchParams?.plan === 'string' ? resolvedSearchParams.plan : null
  const isSaveSuccessVisible = resolvedSearchParams?.updated === '1'

  return (
    <AdminSectionShell
      eyebrow="Admin · Reglas"
      title="Reglas de reserva"
      description="Define qué puede reservar cada membership plan sin tocar excepciones individuales ni mezclar esta superficie con el portal del socio."
    >
      <Suspense fallback={<AdminMembershipPoliciesDashboardSkeleton />}>
        <AdminMembershipPoliciesSection
          selectedPlanId={selectedPlanId}
          isSaveSuccessVisible={isSaveSuccessVisible}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminMembershipPoliciesSection({
  selectedPlanId,
  isSaveSuccessVisible,
}: {
  selectedPlanId: string | null
  isSaveSuccessVisible: boolean
}) {
  const overview = await getAdminMembershipPolicyOverview(selectedPlanId)

  return (
    <AdminMembershipPoliciesDashboard
      overview={overview}
      isSaveSuccessVisible={isSaveSuccessVisible}
    />
  )
}
