import { Suspense } from 'react'

import { getAdminSessionOverview } from '@/modules/admin/server/admin-sessions-overview'
import {
  AdminSessionsDashboard,
  AdminSessionsDashboardSkeleton,
} from '@/modules/admin/ui/admin-sessions-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

type Props = {
  searchParams?: Promise<{ session?: string; updated?: string; notice?: string }>
}

export default async function AdminSessionsPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined
  const sessionId = typeof params?.session === 'string' ? params.session : null
  const updated = typeof params?.updated === 'string' ? params.updated : null
  const notice = typeof params?.notice === 'string' ? params.notice : null

  return (
    <AdminSectionShell
      eyebrow="Admin · Agenda"
      title="Agenda de sesiones"
      description="Programa y publica sesiones: capacidad, coach y estado en un solo sitio."
    >
      <Suspense fallback={<AdminSessionsDashboardSkeleton />}>
        <AdminSessionsSection sessionId={sessionId} updated={updated} notice={notice} />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminSessionsSection({
  sessionId,
  updated,
  notice,
}: {
  sessionId: string | null
  updated: string | null
  notice: string | null
}) {
  const overview = await getAdminSessionOverview({ selectedSessionId: sessionId })
  return <AdminSessionsDashboard overview={overview} updated={updated} notice={notice} />
}
