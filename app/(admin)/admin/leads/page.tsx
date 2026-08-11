import { Suspense } from 'react'

import { AdminLeadsDashboard, AdminLeadsDashboardSkeleton } from '@/modules/admin/ui/admin-leads-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { getAdminLeadOverview } from '@/modules/leads/server/admin-leads-overview'

type AdminLeadsPageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    lead?: string
    updated?: string
    notice?: string
  }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : null
  const status = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : null
  const selectedLeadId = typeof resolvedSearchParams?.lead === 'string' ? resolvedSearchParams.lead : null
  const noticeId = typeof resolvedSearchParams?.notice === 'string' ? resolvedSearchParams.notice : null
  const updatedState =
    resolvedSearchParams?.updated === 'note' ||
    resolvedSearchParams?.updated === 'new' ||
    resolvedSearchParams?.updated === 'contacted' ||
    resolvedSearchParams?.updated === 'qualified' ||
    resolvedSearchParams?.updated === 'lost'
    || resolvedSearchParams?.updated === 'converted'
      ? resolvedSearchParams.updated
      : null

  return (
    <AdminSectionShell
      eyebrow="Admin · Solicitudes"
      title="Solicitudes de contacto"
      description="Revisa las solicitudes de la web, busca por contacto y actualiza su estado."
    >
      <Suspense fallback={<AdminLeadsDashboardSkeleton />}>
        <AdminLeadsSection
          query={query}
          status={status}
          selectedLeadId={selectedLeadId}
          updatedState={updatedState}
          noticeId={noticeId}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminLeadsSection({
  query,
  status,
  selectedLeadId,
  updatedState,
  noticeId,
}: {
  query: string | null
  status: string | null
  selectedLeadId: string | null
  updatedState: 'note' | 'new' | 'contacted' | 'qualified' | 'lost' | 'converted' | null
  noticeId: string | null
}) {
  const overview = await getAdminLeadOverview({
    query,
    status,
    selectedLeadId,
  })

  return (
    <AdminLeadsDashboard
      overview={overview}
      updatedState={updatedState}
      noticeId={noticeId}
    />
  )
}
