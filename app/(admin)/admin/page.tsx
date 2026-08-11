import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getAdminHomeOverview } from '@/modules/admin/server/admin-home-overview'
import { AdminHomeDashboard, AdminHomeDashboardSkeleton } from '@/modules/admin/ui/admin-home-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

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
  const overview = await getAdminHomeOverview()
  return <AdminHomeDashboard overview={overview} />
}
