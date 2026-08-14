import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { readIncludeSandboxFixtures } from '@/lib/sandbox-fixture-request'
import { getAdminHomeOverview } from '@/modules/admin/server/admin-home-overview'
import { readAdminOverview } from '@/modules/admin/server/admin-overview-result'
import { AdminHomeDashboard, AdminHomeDashboardSkeleton } from '@/modules/admin/ui/admin-home-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminOverviewUnavailable } from '@/modules/admin/ui/admin-unavailable-panel'

type AdminHomePageProps = {
  searchParams?: Promise<{ plan?: string; updated?: string }>
}

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  // Preserve deep links created while booking rules lived at /admin.
  if (typeof resolvedSearchParams?.plan === 'string') {
    const params = new URLSearchParams({ plan: resolvedSearchParams.plan })
    if (resolvedSearchParams.updated === '1') params.set('updated', '1')
    redirect(`/admin/rules?${params.toString()}`)
  }

  return (
    <AdminSectionShell
      eyebrow="Admin · Resumen"
      title="Control de hoy"
      description="Resumen de la jornada y lo que necesita atención. Cada bloque abre la pantalla donde se resuelve."
    >
      <Suspense fallback={<AdminHomeDashboardSkeleton />}>
        <AdminHomeSection />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminHomeSection() {
  const overview = await readAdminOverview(async () =>
    getAdminHomeOverview({
      includeSandboxFixtures: await readIncludeSandboxFixtures(),
    }),
  )
  if (!overview.ok) return <AdminOverviewUnavailable retryHref="/admin" />
  return <AdminHomeDashboard overview={overview.data} />
}
