import { Suspense } from 'react'

import { getAdminMemberOverrideOverview } from '@/modules/admin/server/admin-member-overrides-overview'
import {
  AdminMemberOverridesDashboard,
  AdminMemberOverridesDashboardSkeleton,
} from '@/modules/admin/ui/admin-member-overrides-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

type AdminOverridesPageProps = {
  searchParams?: Promise<{
    q?: string
    member?: string
    membership?: string
    session?: string
    updated?: string
  }>
}

export default async function AdminOverridesPage({ searchParams }: AdminOverridesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : null
  const selectedMemberId =
    typeof resolvedSearchParams?.member === 'string' ? resolvedSearchParams.member : null
  const selectedMembershipId =
    typeof resolvedSearchParams?.membership === 'string' ? resolvedSearchParams.membership : null
  const selectedSessionId =
    typeof resolvedSearchParams?.session === 'string' ? resolvedSearchParams.session : null
  const updatedState =
    resolvedSearchParams?.updated === 'extra' ||
    resolvedSearchParams?.updated === 'session' ||
    resolvedSearchParams?.updated === 'revoked' ||
    resolvedSearchParams?.updated === 'revoke-error'
      ? resolvedSearchParams.updated
      : null

  return (
    <AdminSectionShell
      eyebrow="Admin · Excepciones"
      title="Excepciones de reserva"
      description="Busca un socio, confirma la membership o sesión implicada y registra excepciones auditables sin tocar la política base."
    >
      <Suspense fallback={<AdminMemberOverridesDashboardSkeleton />}>
        <AdminMemberOverridesSection
          query={query}
          selectedMemberId={selectedMemberId}
          selectedMembershipId={selectedMembershipId}
          selectedSessionId={selectedSessionId}
          updatedState={updatedState}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminMemberOverridesSection({
  query,
  selectedMemberId,
  selectedMembershipId,
  selectedSessionId,
  updatedState,
}: {
  query: string | null
  selectedMemberId: string | null
  selectedMembershipId: string | null
  selectedSessionId: string | null
  updatedState: 'extra' | 'session' | 'revoked' | 'revoke-error' | null
}) {
  const overview = await getAdminMemberOverrideOverview({
    query,
    selectedMemberId,
    selectedMembershipId,
    selectedSessionId,
  })

  return (
    <AdminMemberOverridesDashboard
      overview={overview}
      updatedState={updatedState}
    />
  )
}
