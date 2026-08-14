import { Suspense } from 'react'

import { readAdminOverview } from '@/modules/admin/server/admin-overview-result'
import { getAdminReportsOverview } from '@/modules/admin/server/admin-reports-overview'
import {
  AdminReportsDashboard,
  AdminReportsDashboardSkeleton,
} from '@/modules/admin/ui/admin-reports-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminOverviewUnavailable } from '@/modules/admin/ui/admin-unavailable-panel'

type AdminReportsPageProps = {
  searchParams?: Promise<{ window?: string }>
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const params = searchParams ? await searchParams : undefined
  const reportWindow = typeof params?.window === 'string' ? params.window : null

  return (
    <AdminSectionShell
      eyebrow="Admin · Rendimiento"
      title="Informes"
      description="Lee actividad, ocupación y captación con ventanas y denominadores explícitos. Sin mezclar datos sandbox con ingresos ni presentar estimaciones como hechos."
    >
      <Suspense key={reportWindow ?? '28d'} fallback={<AdminReportsDashboardSkeleton />}>
        <AdminReportsSection reportWindow={reportWindow} />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminReportsSection({ reportWindow }: { reportWindow: string | null }) {
  const overview = await readAdminOverview(() => getAdminReportsOverview({ window: reportWindow }))
  if (!overview.ok) return <AdminOverviewUnavailable retryHref="/admin/reports" />
  return <AdminReportsDashboard overview={overview.data} />
}
