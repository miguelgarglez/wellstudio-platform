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
    updated?: string
    notice?: string
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
          updatedState={parseUpdatedState(params?.updated)}
          noticeId={typeof params?.notice === 'string' ? params.notice : null}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminMembersSection({
  query,
  status,
  selectedMemberId,
  updatedState,
  noticeId,
}: {
  query: string | null
  status: string | null
  selectedMemberId: string | null
  updatedState: AdminMembersUpdatedState
  noticeId: string | null
}) {
  const overview = await getAdminMembersOverview({ query, status, selectedMemberId })

  return (
    <AdminMembersDashboard
      overview={overview}
      updatedState={updatedState}
      noticeId={noticeId}
    />
  )
}

function parseUpdatedState(value?: string) {
  return value === 'member-active' ||
    value === 'member-inactive' ||
    value === 'member-blocked' ||
    value === 'membership-assigned' ||
    value === 'membership-ended' ||
    value === 'credits-adjusted' ||
    value === 'credit-account-opened' ||
    value === 'member-note-added' ||
    value === 'staff-reservation-booked' ||
    value === 'staff-reservation-canceled' ||
    value === 'staff-waitlist-joined' ||
    value === 'staff-waitlist-left'
    ? value
    : null
}

type AdminMembersUpdatedState =
  | 'member-active'
  | 'member-inactive'
  | 'member-blocked'
  | 'membership-assigned'
  | 'membership-ended'
  | 'credits-adjusted'
  | 'credit-account-opened'
  | 'member-note-added'
  | 'staff-reservation-booked'
  | 'staff-reservation-canceled'
  | 'staff-waitlist-joined'
  | 'staff-waitlist-left'
  | null
