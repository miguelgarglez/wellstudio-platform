import { Suspense } from 'react'

import { getAdminMembersOverview } from '@/modules/admin/server/admin-members-overview'
import {
  AdminMembersDashboard,
  AdminMembersDashboardSkeleton,
} from '@/modules/admin/ui/admin-members-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

type AdminMembersPageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    member?: string
  }>
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const params = searchParams ? await searchParams : undefined

  return (
    <AdminSectionShell
      eyebrow="Admin · Socios"
      title="Gestión de socios"
      description="Localiza un socio y reúne su cuenta, cobertura comercial y actividad reciente antes de operar en otros flujos."
    >
      <Suspense fallback={<AdminMembersDashboardSkeleton />}>
        <AdminMembersSection
          query={typeof params?.q === 'string' ? params.q : null}
          status={typeof params?.status === 'string' ? params.status : null}
          selectedMemberId={typeof params?.member === 'string' ? params.member : null}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminMembersSection({
  query,
  status,
  selectedMemberId,
}: {
  query: string | null
  status: string | null
  selectedMemberId: string | null
}) {
  const overview = await getAdminMembersOverview({ query, status, selectedMemberId })

  return <AdminMembersDashboard overview={overview} />
}
