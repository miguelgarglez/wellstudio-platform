import { Suspense } from 'react'

import { readIncludeSandboxFixtures } from '@/lib/sandbox-fixture-request'
import { getAdminClassCatalogOverview } from '@/modules/admin/server/admin-class-catalog-overview'
import { readAdminOverview } from '@/modules/admin/server/admin-overview-result'
import { AdminClassCatalogDashboard, AdminClassCatalogDashboardSkeleton } from '@/modules/admin/ui/admin-class-catalog-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminOverviewUnavailable } from '@/modules/admin/ui/admin-unavailable-panel'

type Props = { searchParams?: Promise<{ tab?: string; updated?: string; notice?: string }> }

export default async function AdminClassCatalogPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined
  const tab = params?.tab === 'coaches' ? 'coaches' : 'classes'
  const updated = typeof params?.updated === 'string' ? params.updated : null
  const notice = typeof params?.notice === 'string' ? params.notice : null
  return (
    <AdminSectionShell eyebrow="Admin · Agenda · Catálogo" title="Catálogo de clases" description="Mantén los tipos de clase y el equipo que Agenda necesita para programar sesiones reales.">
      <Suspense fallback={<AdminClassCatalogDashboardSkeleton />}>
        <CatalogSection tab={tab} updated={updated} notice={notice} />
      </Suspense>
    </AdminSectionShell>
  )
}

async function CatalogSection({ tab, updated, notice }: { tab: 'classes' | 'coaches'; updated: string | null; notice: string | null }) {
  const overview = await readAdminOverview(async () =>
    getAdminClassCatalogOverview({
      includeSandboxFixtures: await readIncludeSandboxFixtures(),
    }),
  )
  if (!overview.ok) return <AdminOverviewUnavailable retryHref="/admin/sessions/catalog" />
  return <AdminClassCatalogDashboard overview={overview.data} tab={tab} updated={updated} notice={notice} />
}
