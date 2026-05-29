import { Suspense } from 'react'

import { AdminLeadsDashboard, AdminLeadsDashboardSkeleton } from '@/modules/admin/ui/admin-leads-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { getAdminLeadOverview } from '@/modules/leads/server/admin-leads-overview'

type AdminLeadsPageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    updated?: string
  }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : null
  const status = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : null
  const updatedState =
    resolvedSearchParams?.updated === 'new' ||
    resolvedSearchParams?.updated === 'contacted' ||
    resolvedSearchParams?.updated === 'lost'
      ? resolvedSearchParams.updated
      : null

  return (
    <AdminSectionShell
      eyebrow="Admin · Solicitudes"
      title="Solicitudes de contacto"
      description="Revisa las solicitudes captadas desde la web, busca por datos de contacto y mantén su estado operativo al día."
    >
      <Suspense fallback={<AdminLeadsDashboardSkeleton />}>
        <AdminLeadsSection
          query={query}
          status={status}
          updatedState={updatedState}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminLeadsSection({
  query,
  status,
  updatedState,
}: {
  query: string | null
  status: string | null
  updatedState: 'new' | 'contacted' | 'lost' | null
}) {
  const overview = await getAdminLeadOverview({
    query,
    status,
  })

  return (
    <AdminLeadsDashboard
      overview={overview}
      updatedState={updatedState}
    />
  )
}
