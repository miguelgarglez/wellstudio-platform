import { Suspense } from 'react'

import { getAdminMemberOverrideOverview } from '@/modules/admin/server/admin-member-overrides-overview'
import { readAdminOverview } from '@/modules/admin/server/admin-overview-result'
import {
  AdminMemberOverridesDashboard,
  AdminMemberOverridesDashboardSkeleton,
} from '@/modules/admin/ui/admin-member-overrides-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminOverviewUnavailable } from '@/modules/admin/ui/admin-unavailable-panel'

type AdminOverridesPageProps = {
  searchParams?: Promise<{
    q?: string
    member?: string
    updated?: string
  }>
}

export default async function AdminOverridesPage({ searchParams }: AdminOverridesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : null
  const selectedMemberId =
    typeof resolvedSearchParams?.member === 'string' ? resolvedSearchParams.member : null
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
          updatedState={updatedState}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminMemberOverridesSection({
  query,
  selectedMemberId,
  updatedState,
}: {
  query: string | null
  selectedMemberId: string | null
  updatedState: 'extra' | 'session' | 'revoked' | 'revoke-error' | null
}) {
  const overview = await readAdminOverview(() =>
    getAdminMemberOverrideOverview({
      query,
      selectedMemberId,
    }),
  )
  if (!overview.ok) return <AdminOverviewUnavailable retryHref="/admin/overrides" />

  return (
    <AdminMemberOverridesDashboard
      overview={overview.data}
      updatedState={updatedState}
    />
  )
}
